# backend/simulation.py
import random
import time
from typing import Dict, Any, List

class StadiumSimulation:
    def __init__(self):
        # Configuration definitions for Zones
        self.zones = {
            "Gate A": {"type": "gate", "capacity": 8000, "occupancy": 1500, "flow_rate": 80, "wait_time": 5},
            "Gate B": {"type": "gate", "capacity": 8000, "occupancy": 1200, "flow_rate": 75, "wait_time": 4},
            "Gate C": {"type": "gate", "capacity": 10000, "occupancy": 1800, "flow_rate": 90, "wait_time": 6},
            "Gate D": {"type": "gate", "capacity": 8000, "occupancy": 1400, "flow_rate": 70, "wait_time": 5},
            "Gate E": {"type": "gate", "capacity": 8000, "occupancy": 900, "flow_rate": 60, "wait_time": 3},
            "Gate F": {"type": "gate", "capacity": 10000, "occupancy": 2100, "flow_rate": 95, "wait_time": 7},
            
            "Concourse North": {"type": "concourse", "capacity": 12000, "occupancy": 3000, "flow_rate": 200, "wait_time": 0},
            "Concourse East": {"type": "concourse", "capacity": 12000, "occupancy": 4500, "flow_rate": 180, "wait_time": 0},
            "Concourse South": {"type": "concourse", "capacity": 12000, "occupancy": 3500, "flow_rate": 190, "wait_time": 0},
            "Concourse West": {"type": "concourse", "capacity": 12000, "occupancy": 2800, "flow_rate": 170, "wait_time": 0},
            
            "Seating 100 Level": {"type": "seating", "capacity": 30000, "occupancy": 12000, "flow_rate": 400, "wait_time": 0},
            "Seating 200 Level": {"type": "seating", "capacity": 25000, "occupancy": 9500, "flow_rate": 300, "wait_time": 0},
            "Seating 300 Level": {"type": "seating", "capacity": 20000, "occupancy": 8000, "flow_rate": 250, "wait_time": 0},
            
            "Metro Station": {"type": "transit", "capacity": 15000, "occupancy": 2000, "flow_rate": 220, "wait_time": 8},
            "West Shuttle Lot": {"type": "transit", "capacity": 8000, "occupancy": 800, "flow_rate": 120, "wait_time": 4},
            "East Rideshare Zone": {"type": "transit", "capacity": 6000, "occupancy": 600, "flow_rate": 90, "wait_time": 5}
        }
        
        # Gate status ('open', 'locked', 'slowed')
        self.gate_statuses = {
            "Gate A": "open",
            "Gate B": "open",
            "Gate C": "open",
            "Gate D": "open",
            "Gate E": "open",
            "Gate F": "open"
        }
        
        self.scenario = "normal"  # normal, weather_delay, gate_failure, post_match, evacuation
        self.speed = 1.0  # simulation speed multiplier
        self.incidents = []
        self.attendance = 29500
        self.max_attendance = 75000
        self.match_time = "Pre-Match (45 mins to Kickoff)"
        self.time_seconds = 0
        
        # Volunteer squads
        self.volunteers = [
            {"id": "V1", "name": "Squad Alpha", "zone": "Gate A", "status": "idle", "task": None},
            {"id": "V2", "name": "Squad Beta", "zone": "Gate C", "status": "idle", "task": None},
            {"id": "V3", "name": "Squad Gamma", "zone": "Concourse East", "status": "idle", "task": None},
            {"id": "V4", "name": "Squad Delta", "zone": "Gate F", "status": "idle", "task": None},
            {"id": "V5", "name": "Squad Epsilon", "zone": "Metro Station", "status": "idle", "task": None}
        ]

    def set_scenario(self, scenario: str):
        if scenario not in ["normal", "weather_delay", "gate_failure", "post_match", "evacuation"]:
            return False
        self.scenario = scenario
        
        # Reset appropriate parameters
        self.incidents = []
        if scenario == "normal":
            self.match_time = "Pre-Match (45 mins to Kickoff)"
            self.attendance = 29500
            for gate in self.gate_statuses:
                self.gate_statuses[gate] = "open"
        elif scenario == "weather_delay":
            self.match_time = "Delayed (Storm Warning)"
            self.attendance = 42000
            self.incidents.append({
                "id": "inc_weather",
                "type": "weather",
                "severity": "medium",
                "zone": "Concourse East",
                "message": "Storm Delay: Fans crowding concourses for shelter."
            })
        elif scenario == "gate_failure":
            self.match_time = "Pre-Match (30 mins to Kickoff)"
            self.attendance = 38000
            self.gate_statuses["Gate C"] = "slowed"
            self.incidents.append({
                "id": "inc_gate_c",
                "type": "technical",
                "severity": "high",
                "zone": "Gate C",
                "message": "Gate C Ticket Scanners Failure. Wait times escalating rapidly."
            })
        elif scenario == "post_match":
            self.match_time = "Full Time (Egress Phase)"
            self.attendance = 74500
            for gate in self.gate_statuses:
                self.gate_statuses[gate] = "open"
        elif scenario == "evacuation":
            self.match_time = "EMERGENCY - EVACUATE IMMEDIATELY"
            self.attendance = 73000
            self.incidents.append({
                "id": "inc_evac",
                "type": "security",
                "severity": "critical",
                "zone": "Seating 100 Level",
                "message": "Stadium Evacuation Alarm triggered. Please direct fans to nearest exit gates."
            })
        return True

    def set_speed(self, speed: float):
        self.speed = max(0.0, min(speed, 10.0))

    def update_gate_status(self, gate: str, status: str):
        if gate in self.gate_statuses and status in ["open", "locked", "slowed"]:
            self.gate_statuses[gate] = status
            return True
        return False

    def add_incident(self, incident_type: str, severity: str, zone: str, message: str):
        inc_id = f"inc_{int(time.time())}_{random.randint(100, 999)}"
        new_inc = {
            "id": inc_id,
            "type": incident_type,
            "severity": severity,
            "zone": zone,
            "message": message
        }
        self.incidents.append(new_inc)
        return new_inc

    def resolve_incident(self, incident_id: str):
        self.incidents = [inc for inc in self.incidents if inc["id"] != incident_id]

    def update_volunteer(self, volunteer_id: str, zone: str, status: str, task: str = None):
        for vol in self.volunteers:
            if vol["id"] == volunteer_id:
                vol["zone"] = zone
                vol["status"] = status
                vol["task"] = task
                return True
        return False

    def step(self):
        # Advance simulation clocks
        tick_time = 1 * self.speed
        self.time_seconds += tick_time
        
        # Simple dynamics depending on match scenario
        if self.scenario == "normal":
            # Flow from gates into concourses, then into seating
            arrival_rate = 35 * self.speed
            self.attendance = min(self.max_attendance, self.attendance + arrival_rate)
            
            # Update Gate occupancies
            for gate in ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]:
                g_stat = self.gate_statuses[gate]
                capacity_mod = 1.0 if g_stat == "open" else (0.2 if g_stat == "slowed" else 0.0)
                
                # Dynamic incoming rate + processing
                incoming = random.randint(15, 30) * self.speed
                processed = min(self.zones[gate]["occupancy"], self.zones[gate]["flow_rate"] * capacity_mod * (self.speed / 10))
                
                self.zones[gate]["occupancy"] = max(0, int(self.zones[gate]["occupancy"] + incoming - processed))
                self.zones[gate]["wait_time"] = max(1, int(self.zones[gate]["occupancy"] / (self.zones[gate]["flow_rate"] * capacity_mod + 0.1)))
                
                # Flow processed people to the closest concourse
                concourse_map = {
                    "Gate A": "Concourse North", "Gate B": "Concourse North",
                    "Gate C": "Concourse East", "Gate D": "Concourse South",
                    "Gate E": "Concourse West", "Gate F": "Concourse West"
                }
                target_cc = concourse_map[gate]
                self.zones[target_cc]["occupancy"] = min(self.zones[target_cc]["capacity"], self.zones[target_cc]["occupancy"] + int(processed))

            # Concourse to Seating Bowls flow
            for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                # Fans move from concourse to seats
                moving_to_seats = min(self.zones[concourse]["occupancy"], random.randint(30, 60) * self.speed)
                self.zones[concourse]["occupancy"] = max(100, int(self.zones[concourse]["occupancy"] - moving_to_seats))
                
                # Distribute to Seating levels
                self.zones["Seating 100 Level"]["occupancy"] = min(30000, self.zones["Seating 100 Level"]["occupancy"] + int(moving_to_seats * 0.4))
                self.zones["Seating 200 Level"]["occupancy"] = min(25000, self.zones["Seating 200 Level"]["occupancy"] + int(moving_to_seats * 0.35))
                self.zones["Seating 300 Level"]["occupancy"] = min(20000, self.zones["Seating 300 Level"]["occupancy"] + int(moving_to_seats * 0.25))
                
            # Transit Hubs have low arrivals
            for transit in ["Metro Station", "West Shuttle Lot", "East Rideshare Zone"]:
                incoming = random.randint(5, 15) * self.speed
                processed = min(self.zones[transit]["occupancy"], self.zones[transit]["flow_rate"] * (self.speed / 10))
                self.zones[transit]["occupancy"] = max(100, int(self.zones[transit]["occupancy"] + incoming - processed))
                self.zones[transit]["wait_time"] = max(1, int(self.zones[transit]["occupancy"] / (self.zones[transit]["flow_rate"] + 0.1)))

        elif self.scenario == "weather_delay":
            # Fans rush back to concourses for shelter, staying away from outer gates
            # Gates process slowly
            for gate in ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]:
                self.zones[gate]["occupancy"] = max(100, int(self.zones[gate]["occupancy"] - random.randint(10, 20) * self.speed))
                self.zones[gate]["wait_time"] = 2
                
            # Seating to concourses flow (seeking cover)
            for seating in ["Seating 100 Level", "Seating 200 Level", "Seating 300 Level"]:
                seeking_cover = min(self.zones[seating]["occupancy"], random.randint(50, 100) * self.speed)
                self.zones[seating]["occupancy"] = max(2000, int(self.zones[seating]["occupancy"] - seeking_cover))
                
                # Distribute to concourses
                for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                    self.zones[concourse]["occupancy"] = min(self.zones[concourse]["capacity"], self.zones[concourse]["occupancy"] + int(seeking_cover / 4))
            
            # High concourse occupancy
            for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                # Crowd is dense and static, so flow_rate is low
                self.zones[concourse]["flow_rate"] = 50
                
            # Transit operations slowed down
            for transit in ["Metro Station", "West Shuttle Lot", "East Rideshare Zone"]:
                self.zones[transit]["occupancy"] = min(self.zones[transit]["capacity"], self.zones[transit]["occupancy"] + random.randint(15, 30) * self.speed)
                self.zones[transit]["wait_time"] = max(15, int(self.zones[transit]["occupancy"] / 40))

        elif self.scenario == "gate_failure":
            # Similar to normal, but Gate C is extremely slow
            arrival_rate = 30 * self.speed
            self.attendance = min(self.max_attendance, self.attendance + arrival_rate)
            
            for gate in ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]:
                g_stat = self.gate_statuses[gate]
                capacity_mod = 1.0 if g_stat == "open" else (0.1 if g_stat == "slowed" else 0.0)
                
                # If Gate C is failing, incoming is still high, but processing is tiny
                incoming = random.randint(30, 45) * self.speed if gate == "Gate C" else random.randint(15, 25) * self.speed
                processed = min(self.zones[gate]["occupancy"], self.zones[gate]["flow_rate"] * capacity_mod * (self.speed / 10))
                
                self.zones[gate]["occupancy"] = max(0, int(self.zones[gate]["occupancy"] + incoming - processed))
                self.zones[gate]["wait_time"] = max(1, int(self.zones[gate]["occupancy"] / (self.zones[gate]["flow_rate"] * capacity_mod + 0.1)))
                
                concourse_map = {
                    "Gate A": "Concourse North", "Gate B": "Concourse North",
                    "Gate C": "Concourse East", "Gate D": "Concourse South",
                    "Gate E": "Concourse West", "Gate F": "Concourse West"
                }
                target_cc = concourse_map[gate]
                self.zones[target_cc]["occupancy"] = min(self.zones[target_cc]["capacity"], self.zones[target_cc]["occupancy"] + int(processed))
                
            # Dynamic re-routing: if volunteers dispatch to Gate C, it relieves congestion slightly
            gate_c_vols = [v for v in self.volunteers if v["zone"] == "Gate C" and v["status"] == "dispatched"]
            if gate_c_vols:
                rerouted = min(self.zones["Gate C"]["occupancy"], int(40 * len(gate_c_vols) * self.speed))
                self.zones["Gate C"]["occupancy"] -= rerouted
                self.zones["Gate B"]["occupancy"] += int(rerouted * 0.5)
                self.zones["Gate D"]["occupancy"] += int(rerouted * 0.5)

            # Move from concourses to seats
            for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                moving_to_seats = min(self.zones[concourse]["occupancy"], random.randint(30, 50) * self.speed)
                self.zones[concourse]["occupancy"] = max(200, int(self.zones[concourse]["occupancy"] - moving_to_seats))
                self.zones["Seating 100 Level"]["occupancy"] = min(30000, self.zones["Seating 100 Level"]["occupancy"] + int(moving_to_seats * 0.4))
                self.zones["Seating 200 Level"]["occupancy"] = min(25000, self.zones["Seating 200 Level"]["occupancy"] + int(moving_to_seats * 0.35))
                self.zones["Seating 300 Level"]["occupancy"] = min(20000, self.zones["Seating 300 Level"]["occupancy"] + int(moving_to_seats * 0.25))

        elif self.scenario == "post_match":
            # Egress flow: Seating Bowls -> Concourses -> Gates -> Transit Hubs
            leaving_seating = 0
            for seating in ["Seating 100 Level", "Seating 200 Level", "Seating 300 Level"]:
                flow_out = min(self.zones[seating]["occupancy"], random.randint(120, 200) * self.speed)
                self.zones[seating]["occupancy"] = max(0, int(self.zones[seating]["occupancy"] - flow_out))
                leaving_seating += flow_out
                
            # Distribute leaving crowd to concourses
            for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                self.zones[concourse]["occupancy"] = min(self.zones[concourse]["capacity"], self.zones[concourse]["occupancy"] + int(leaving_seating / 4))
                
            # Flow from concourses to Gates
            leaving_concourses = {}
            for concourse in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                flow_out = min(self.zones[concourse]["occupancy"], random.randint(100, 150) * self.speed)
                self.zones[concourse]["occupancy"] = max(100, int(self.zones[concourse]["occupancy"] - flow_out))
                leaving_concourses[concourse] = flow_out

            # Map concourses to exits
            gate_shares = {
                "Gate A": leaving_concourses["Concourse North"] * 0.5,
                "Gate B": leaving_concourses["Concourse North"] * 0.5,
                "Gate C": leaving_concourses["Concourse East"],
                "Gate D": leaving_concourses["Concourse South"],
                "Gate E": leaving_concourses["Concourse West"] * 0.5,
                "Gate F": leaving_concourses["Concourse West"] * 0.5,
            }
            
            for gate, crowd_share in gate_shares.items():
                g_stat = self.gate_statuses[gate]
                capacity_mod = 1.0 if g_stat == "open" else (0.2 if g_stat == "slowed" else 0.0)
                
                self.zones[gate]["occupancy"] = min(self.zones[gate]["capacity"], self.zones[gate]["occupancy"] + int(crowd_share))
                processed = min(self.zones[gate]["occupancy"], self.zones[gate]["flow_rate"] * 1.5 * capacity_mod * (self.speed / 10))
                self.zones[gate]["occupancy"] = max(0, int(self.zones[gate]["occupancy"] - processed))
                self.zones[gate]["wait_time"] = max(1, int(self.zones[gate]["occupancy"] / (self.zones[gate]["flow_rate"] * capacity_mod + 0.1)))
                
                # 70% go to Metro, 15% Shuttle, 15% Rideshare
                self.zones["Metro Station"]["occupancy"] = min(self.zones["Metro Station"]["capacity"], self.zones["Metro Station"]["occupancy"] + int(processed * 0.7))
                self.zones["West Shuttle Lot"]["occupancy"] = min(self.zones["West Shuttle Lot"]["capacity"], self.zones["West Shuttle Lot"]["occupancy"] + int(processed * 0.15))
                self.zones["East Rideshare Zone"]["occupancy"] = min(self.zones["East Rideshare Zone"]["capacity"], self.zones["East Rideshare Zone"]["occupancy"] + int(processed * 0.15))

            # Transit hub evacuation
            for transit in ["Metro Station", "West Shuttle Lot", "East Rideshare Zone"]:
                transit_dispatch = 1.2 if transit == "Metro Station" else 1.0
                processed = min(self.zones[transit]["occupancy"], self.zones[transit]["flow_rate"] * transit_dispatch * (self.speed / 10))
                self.zones[transit]["occupancy"] = max(0, int(self.zones[transit]["occupancy"] - processed))
                self.zones[transit]["wait_time"] = max(1, int(self.zones[transit]["occupancy"] / (self.zones[transit]["flow_rate"] * transit_dispatch + 0.1)))
                self.attendance = max(0, self.attendance - int(processed))

        elif self.scenario == "evacuation":
            for gate in self.gate_statuses:
                self.gate_statuses[gate] = "open"
                
            total_evacuated = 0
            for seating in ["Seating 100 Level", "Seating 200 Level", "Seating 300 Level"]:
                flow_out = min(self.zones[seating]["occupancy"], random.randint(300, 500) * self.speed)
                self.zones[seating]["occupancy"] = max(0, int(self.zones[seating]["occupancy"] - flow_out))
                for cc in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                    self.zones[cc]["occupancy"] = min(self.zones[cc]["capacity"], self.zones[cc]["occupancy"] + int(flow_out / 4))
            
            for cc in ["Concourse North", "Concourse East", "Concourse South", "Concourse West"]:
                flow_out = min(self.zones[cc]["occupancy"], random.randint(250, 400) * self.speed)
                self.zones[cc]["occupancy"] = max(0, int(self.zones[cc]["occupancy"] - flow_out))
                
                gate_targets = {
                    "Concourse North": ["Gate A", "Gate B"],
                    "Concourse East": ["Gate C"],
                    "Concourse South": ["Gate D"],
                    "Concourse West": ["Gate E", "Gate F"]
                }[cc]
                
                for g in gate_targets:
                    self.zones[g]["occupancy"] = min(self.zones[g]["capacity"], self.zones[g]["occupancy"] + int(flow_out / len(gate_targets)))

            for gate in ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]:
                processed = min(self.zones[gate]["occupancy"], self.zones[gate]["flow_rate"] * 3.0 * (self.speed / 10))
                self.zones[gate]["occupancy"] = max(0, int(self.zones[gate]["occupancy"] - processed))
                self.zones[gate]["wait_time"] = 0
                total_evacuated += processed
                
            self.attendance = max(0, self.attendance - int(total_evacuated))
            
            for transit in ["Metro Station", "West Shuttle Lot", "East Rideshare Zone"]:
                processed = min(self.zones[transit]["occupancy"], self.zones[transit]["flow_rate"] * 2.0 * (self.speed / 10))
                self.zones[transit]["occupancy"] = max(0, int(self.zones[transit]["occupancy"] - processed))
                self.zones[transit]["wait_time"] = 0

        # Adjust risk and density levels for every zone
        for name, zone in self.zones.items():
            density = zone["occupancy"] / zone["capacity"]
            zone["density"] = min(1.0, density)
            
            if density < 0.4:
                zone["risk_level"] = "low"
            elif density < 0.75:
                zone["risk_level"] = "medium"
            elif density < 0.9:
                zone["risk_level"] = "high"
            else:
                zone["risk_level"] = "critical"

        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        return {
            "zones": self.zones,
            "gate_statuses": self.gate_statuses,
            "scenario": self.scenario,
            "speed": self.speed,
            "incidents": self.incidents,
            "attendance": int(self.attendance),
            "max_attendance": self.max_attendance,
            "match_time": self.match_time,
            "volunteers": self.volunteers
        }
