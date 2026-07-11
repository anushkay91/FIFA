# backend/agents.py
from typing import Dict, Any, List

class CrowdIntelligenceAgent:
    """
    Predicts crowd densities and wait times 20-40 minutes ahead 
    using current simulator states, queue size, and arrival velocities.
    """
    def predict_congestion(self, sim_state: Dict[str, Any]) -> Dict[str, Any]:
        predictions = {}
        zones = sim_state["zones"]
        scenario = sim_state["scenario"]
        speed = sim_state["speed"]
        
        for name, zone in zones.items():
            if zone["type"] not in ["gate", "concourse", "transit"]:
                continue
                
            current_occ = zone["occupancy"]
            capacity = zone["capacity"]
            flow_rate = zone["flow_rate"]
            
            # Predict 30 mins ahead projection
            # In a real model, this uses historical arrivals, poisson distributions, and scan velocity
            # We simulate this velocity projection
            if scenario == "normal":
                growth_factor = 1.15 if zone["type"] == "gate" else 1.2
            elif scenario == "weather_delay":
                growth_factor = 0.8 if zone["type"] == "gate" else 1.45
            elif scenario == "gate_failure":
                growth_factor = 1.65 if name == "Gate C" else 1.1
            elif scenario == "post_match":
                growth_factor = 1.4 if zone["type"] == "transit" else 0.7
            elif scenario == "evacuation":
                growth_factor = 0.2 if zone["type"] in ["gate", "concourse"] else 0.1
            else:
                growth_factor = 1.0
                
            predicted_occupancy = min(capacity, int(current_occ * growth_factor))
            predicted_density = predicted_occupancy / capacity
            
            # Estimate future wait time
            if zone["type"] == "gate":
                gate_status = sim_state["gate_statuses"].get(name, "open")
                cap_mod = 1.0 if gate_status == "open" else (0.2 if gate_status == "slowed" else 0.01)
                predicted_wait = int(predicted_occupancy / (flow_rate * cap_mod + 0.1))
            elif zone["type"] == "transit":
                predicted_wait = int(predicted_occupancy / (flow_rate * 1.1 + 0.1))
            else:
                predicted_wait = 0
                
            # Define predicted risk level
            if predicted_density < 0.4:
                predicted_risk = "low"
            elif predicted_density < 0.75:
                predicted_risk = "medium"
            elif predicted_density < 0.9:
                predicted_risk = "high"
            else:
                predicted_risk = "critical"
                
            predictions[name] = {
                "predicted_occupancy": predicted_occupancy,
                "predicted_density": min(1.0, predicted_density),
                "predicted_wait_time": max(1, predicted_wait),
                "predicted_risk": predicted_risk,
                "trend": "increasing" if growth_factor > 1.0 else "decreasing"
            }
            
        return predictions


class FanAgent:
    """
    Generates personalized routes, step-by-step maps, translations, 
    evacuation guidance, and vendor recommendations.
    """
    TRANSLATIONS = {
        "en": {
            "enter": "Enter via",
            "security": "Pass through security screening and ticket validation.",
            "concourse": "Head to",
            "section": "Locate Section",
            "row": "Row",
            "seat": "Seat",
            "step_free": "Accessibility Alert: Route uses elevators/ramps, avoiding all stairs.",
            "standard_path": "Route uses escalators and stairs.",
            "vendor_recommend": "Recommended vendor stop:",
            "restroom": "Nearest accessible restroom is at Section",
            "evac": "EVACUATION INSTRUCTIONS: In case of emergency, proceed calmly to the nearest exit:",
            "green_path": "This route is optimized to minimize carbon footprint and queue times."
        },
        "es": {
            "enter": "Ingrese por",
            "security": "Pase por el control de seguridad y validación de boletos.",
            "concourse": "Diríjase a",
            "section": "Ubique la Sección",
            "row": "Fila",
            "seat": "Asiento",
            "step_free": "Alerta de accesibilidad: La ruta utiliza ascensores/rampas, evitando escaleras.",
            "standard_path": "La ruta utiliza escaleras mecánicas y escaleras ordinarias.",
            "vendor_recommend": "Parada recomendada de comida/tienda:",
            "restroom": "El baño accesible más cercano está en la Sección",
            "evac": "INSTRUCCIONES DE EVACUACIÓN: En caso de emergencia, diríjase con calma a la salida más cercana:",
            "green_path": "Esta ruta está optimizada para reducir la huella de carbono y los tiempos de espera."
        },
        "fr": {
            "enter": "Entrez par",
            "security": "Passez le contrôle de sécurité et la validation des billets.",
            "concourse": "Dirigez-vous vers",
            "section": "Localisez la Section",
            "row": "Rangée",
            "seat": "Siège",
            "step_free": "Alerte d'accessibilité: L'itinéraire utilise des ascenseurs/rampes, évitant les escaliers.",
            "standard_path": "L'itinéraire utilise des escaliers mécaniques et des escaliers.",
            "vendor_recommend": "Arrêt recommandé pour la nourriture/boutique:",
            "restroom": "Les toilettes accessibles les plus proches sont à la Section",
            "evac": "INSTRUCTIONS D'ÉVACUATION: En cas d'urgence, dirigez-vous calmement vers la sortie la plus proche:",
            "green_path": "Cet itinéraire est optimisé pour réduire l'empreinte carbone et les temps d'attente."
        },
        "pt": {
            "enter": "Entre pelo",
            "security": "Passe pela triagem de segurança e validação de ingressos.",
            "concourse": "Dirija-se ao",
            "section": "Localize a Seção",
            "row": "Fileira",
            "seat": "Assento",
            "step_free": "Alerta de Acessibilidade: A rota utiliza elevadores/rampas, evitando escadas.",
            "standard_path": "A rota utiliza escadas mecânicas e escadas normais.",
            "vendor_recommend": "Parada de compras/alimentação recomendada:",
            "restroom": "O banheiro acessível mais próximo fica na Seção",
            "evac": "INSTRUÇÕES DE EVACUAÇÃO: Em caso de emergência, dirija-se calmamente à saída mais próxima:",
            "green_path": "Esta rota é otimizada para minimizar a pegada de carbono e o tempo de fila."
        },
        "ar": {
            "enter": "الدخول عبر",
            "security": "المرور عبر الفحص الأمني والتحقق من التذاكر.",
            "concourse": "توجه إلى",
            "section": "حدد القسم",
            "row": "الصف",
            "seat": "المقعد",
            "step_free": "تنبيه إمكانية الوصول: المسار يستخدم المصاعد والمنحدرات لتجنب السلالم.",
            "standard_path": "المسار يستخدم السلالم الكهربائية والسلالم العادية.",
            "vendor_recommend": "المتجر أو المطعم الموصى به:",
            "restroom": "أقرب دورة مياه مهيأة تقع في القسم",
            "evac": "تعليمات الإخلاء: في حالة الطوارئ، يرجى التوجه بهدوء إلى أقرب مخرج:",
            "green_path": "تم تحسين هذا المسار لتقليل الانبعاثات الكربونية وأوقات الانتظار."
        }
    }

    def generate_route(self, seat_section: int, seat_row: str, seat_num: int, 
                       lang: str, accessibility: bool, vendor_pref: str) -> Dict[str, Any]:
        lang = lang.lower() if lang.lower() in self.TRANSLATIONS else "en"
        t = self.TRANSLATIONS[lang]
        
        # Determine gate and concourse based on section
        # Section 100-110 / 200-210 -> Gate A/B, Concourse North
        # Section 111-120 / 211-220 -> Gate C, Concourse East
        # Section 121-130 / 221-230 -> Gate D, Concourse South
        # Section 131-140 / 231-240 -> Gate E/F, Concourse West
        if seat_section <= 110:
            gate = "Gate A"
            concourse = "Concourse North"
            nearby_section = 105
        elif seat_section <= 120:
            gate = "Gate C"
            concourse = "Concourse East"
            nearby_section = 115
        elif seat_section <= 130:
            gate = "Gate D"
            concourse = "Concourse South"
            nearby_section = 125
        else:
            gate = "Gate F"
            concourse = "Concourse West"
            nearby_section = 135
            
        steps = []
        # Step 1: Entry
        steps.append(f"📍 {t['enter']} {gate}. {t['security']}")
        
        # Step 2: Transit concourse
        steps.append(f"🚶 {t['concourse']} {concourse}.")
        
        # Accessibility routing
        if accessibility:
            steps.append(f"♿ {t['step_free']}")
        else:
            steps.append(f"🪜 {t['standard_path']}")
            
        # Vendor Stop
        vendor_msg = ""
        if vendor_pref == "food":
            vendor_msg = "World Cup Eats (Fast Pass Lane)"
        elif vendor_pref == "merch":
            vendor_msg = "FIFA Official Store (Express Checkout)"
        elif vendor_pref == "restroom":
            vendor_msg = f"{t['restroom']} {nearby_section}"
            
        if vendor_msg:
            steps.append(f"🍔 {t['vendor_recommend']} {vendor_msg}.")
            
        # Final Seat Destination
        steps.append(f"🏟️ {t['section']} {seat_section}, {t['row']} {seat_row}, {t['seat']} {seat_num}.")
        
        # Evacuation
        evac_path = f"⚠️ {t['evac']} {gate}."
        
        # Sustainability info
        sustainability_note = t['green_path']
        
        return {
            "entry_gate": gate,
            "concourse": concourse,
            "steps": steps,
            "evacuation": evac_path,
            "sustainability": sustainability_note
        }


class OperationsCopilotAgent:
    """
    Analyzes live dashboard metrics, identifies queue bottlenecks,
    weather threats, safety issues, and outputs natural language briefings.
    """
    def generate_briefing(self, sim_state: Dict[str, Any], predictions: Dict[str, Any]) -> Dict[str, Any]:
        scenario = sim_state["scenario"]
        zones = sim_state["zones"]
        incidents = sim_state["incidents"]
        gate_statuses = sim_state["gate_statuses"]
        
        briefing = ""
        recommendations = []
        risk_level = "low"
        
        # Count high-risk areas
        critical_zones = [name for name, z in zones.items() if z["risk_level"] == "critical"]
        high_zones = [name for name, z in zones.items() if z["risk_level"] == "high"]
        
        if scenario == "normal":
            briefing = "Stadium operations are running optimally. Entry flow at all gates is stable. Current attendance is at approximately {:.1f}% capacity. No severe bottlenecks detected.".format(
                (sim_state["attendance"] / sim_state["max_attendance"]) * 100
            )
            recommendations = [
                "Maintain standard ticket scanning gate speeds.",
                "Observe Concourse East queue progression for food concessions.",
                "Ensure Metro Station trains maintain their 6-minute scheduling interval."
            ]
            risk_level = "low"
            
        elif scenario == "weather_delay":
            briefing = "ALERT: Heavy Storm Warning in effect. Fans have rushed to concourses for shelter, leading to extreme densities in Concourse North and East. External gates are experiencing low processing rates as fans avoid seating bowls."
            recommendations = [
                "Deploy volunteers to Concourses East and North to manage layout and prevent stampede hazards.",
                "Announce rain delays and overhead canopy seating safety via PA systems.",
                "Delay inbound transit arrivals slightly to avoid platform crowding at Metro Station.",
                "Broadcast shelter guidance in English, Spanish, and Portuguese on fan apps."
            ]
            risk_level = "high"
            
        elif scenario == "gate_failure":
            gate_c_wait = zones["Gate C"]["wait_time"]
            briefing = f"CRITICAL INCIDENT: Technical scanner error at Gate C. Ticket validations have slowed by 90%, causing queue sizes to surge. Estimated wait time at Gate C is now {gate_c_wait} minutes, which will increase to {predictions.get('Gate C', {}).get('predicted_wait_time', 45)} minutes within 20 minutes."
            recommendations = [
                "Reroute fans approaching Gate C to adjacent Gate B (wait: {} mins) or Gate D (wait: {} mins).".format(zones["Gate B"]["wait_time"], zones["Gate D"]["wait_time"]),
                "Dispatch Volunteer Squad Beta to Gate C immediately to perform manual ticket checks or direct crowds.",
                "Push dynamic mobile notifications to fans within 500m of Gate C advising alternate entry gates.",
                "Initiate Gate C scanner firmware override protocols."
            ]
            risk_level = "high"
            
        elif scenario == "post_match":
            briefing = "Egress phase is in progress. The match has ended and fans are leaving the seating levels. Metro Station queue is building rapidly. West Shuttle Lot is operating with stable capacity."
            recommendations = [
                "Increase Metro train dispatch frequency to maximum (every 3 minutes).",
                "Deploy transit marshals to the Metro entrance to pulse-flow the queues.",
                "Direct Concourse West departures towards the West Shuttle Lot to relieve Metro congestion."
            ]
            risk_level = "medium"
            
        elif scenario == "evacuation":
            briefing = "EMERGENCY: General stadium evacuation is active. Fire and security sensors triggered an alarm in the Seating Bowls. Fans are moving towards nearest gates. Gates are locked open to guarantee free outflow."
            recommendations = [
                "Ensure all security barriers and turnstiles are locked in the 'OPEN' position.",
                "Direct all available volunteer and safety personnel to direct fans out through Gates A-F.",
                "Coordinate with transit authorities to halt standard inbound trains and establish emergency bus corridors.",
                "Announce emergency egress instructions in all five languages continuously."
            ]
            risk_level = "critical"

        # General incidents override
        if incidents and scenario != "evacuation":
            # Add general incident notes
            briefing += " Note: Active incidents include: " + ", ".join([inc["message"] for inc in incidents])
            risk_level = "high"
            
        return {
            "summary": briefing,
            "recommendations": recommendations,
            "risk_level": risk_level,
            "critical_count": len(critical_zones),
            "high_count": len(high_zones)
        }


class VolunteerAgent:
    """
    Scans for high crowd densities or critical alerts and auto-dispatches 
    idle volunteer squads, generating detailed tasks.
    """
    def dispatch_squads(self, sim_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        volunteers = sim_state["volunteers"]
        zones = sim_state["zones"]
        scenario = sim_state["scenario"]
        incidents = sim_state["incidents"]
        
        dispatched_updates = []
        
        # Check high priority targets for volunteers
        # Priority 1: Incidents
        # Priority 2: Critical Gates
        # Priority 3: Critical Concourses
        targets = []
        
        for inc in incidents:
            targets.append({
                "zone": inc["zone"],
                "task": f"Resolve Incident: {inc['message']}",
                "priority": 1
            })
            
        for name, zone in zones.items():
            if zone["risk_level"] in ["high", "critical"]:
                if zone["type"] == "gate":
                    targets.append({
                        "zone": name,
                        "task": f"Manage gate queues. Reroute fans to lower density entry gates.",
                        "priority": 2
                    })
                elif zone["type"] == "concourse":
                    targets.append({
                        "zone": name,
                        "task": f"Clear concourse bottlenecks. Direct fans away from choke points.",
                        "priority": 3
                    })
                    
        # Assign targets to volunteers
        target_idx = 0
        for vol in volunteers:
            # If scenario is evacuation, override everything to emergency crowd control
            if scenario == "evacuation":
                vol["status"] = "dispatched"
                vol["task"] = "EMERGENCY: Direct fans to nearest exit gates. Prevent panic."
                # Assign to egress gates
                exit_gates = ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]
                vol["zone"] = exit_gates[hash(vol["id"]) % len(exit_gates)]
            elif target_idx < len(targets):
                target = targets[target_idx]
                vol["status"] = "dispatched"
                vol["zone"] = target["zone"]
                vol["task"] = target["task"]
                target_idx += 1
            else:
                # Idle reset
                if vol["status"] == "dispatched" and not incidents and all(z["risk_level"] not in ["high", "critical"] for z in zones.values()):
                    vol["status"] = "idle"
                    vol["task"] = None
                    
        return volunteers
