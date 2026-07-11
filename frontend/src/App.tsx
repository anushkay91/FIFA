// src/App.tsx
import { useState, useEffect, useRef } from "react";
import { DigitalTwin } from "./components/DigitalTwin";
import { FanDashboard } from "./components/FanDashboard";
import { OpsDashboard } from "./components/OpsDashboard";
import { VolunteerDashboard } from "./components/VolunteerDashboard";
import { SecurityDashboard } from "./components/SecurityDashboard";
import { TransportDashboard } from "./components/TransportDashboard";

const getApiBase = () => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }
  return "";
};

const getWsUrl = () => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "ws://localhost:8000/ws";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

// Local backup types
interface Zone {
  type: string;
  capacity: number;
  occupancy: number;
  flow_rate: number;
  wait_time: number;
  density: number;
  risk_level: string;
}

interface Volunteer {
  id: string;
  name: string;
  zone: string;
  status: string;
  task: string | null;
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  zone: string;
  message: string;
}

export default function App() {
  const [role, setRole] = useState<"fan" | "ops" | "volunteer" | "security" | "transport">("ops");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ entry_gate: string; concourse: string } | null>(null);
  
  // Real-time states
  const [zones, setZones] = useState<Record<string, Zone>>({
    "Gate A": { type: "gate", capacity: 8000, occupancy: 1500, flow_rate: 80, wait_time: 5, density: 0.18, risk_level: "low" },
    "Gate B": { type: "gate", capacity: 8000, occupancy: 1200, flow_rate: 75, wait_time: 4, density: 0.15, risk_level: "low" },
    "Gate C": { type: "gate", capacity: 10000, occupancy: 1800, flow_rate: 90, wait_time: 6, density: 0.18, risk_level: "low" },
    "Gate D": { type: "gate", capacity: 8000, occupancy: 1400, flow_rate: 70, wait_time: 5, density: 0.175, risk_level: "low" },
    "Gate E": { type: "gate", capacity: 8000, occupancy: 900, flow_rate: 60, wait_time: 3, density: 0.11, risk_level: "low" },
    "Gate F": { type: "gate", capacity: 10000, occupancy: 2100, flow_rate: 95, wait_time: 7, density: 0.21, risk_level: "low" },
    "Concourse North": { type: "concourse", capacity: 12000, occupancy: 3000, flow_rate: 200, wait_time: 0, density: 0.25, risk_level: "low" },
    "Concourse East": { type: "concourse", capacity: 12000, occupancy: 4500, flow_rate: 180, wait_time: 0, density: 0.375, risk_level: "low" },
    "Concourse South": { type: "concourse", capacity: 12000, occupancy: 3500, flow_rate: 190, wait_time: 0, density: 0.29, risk_level: "low" },
    "Concourse West": { type: "concourse", capacity: 12000, occupancy: 2800, flow_rate: 170, wait_time: 0, density: 0.23, risk_level: "low" },
    "Seating 100 Level": { type: "seating", capacity: 30000, occupancy: 12000, flow_rate: 400, wait_time: 0, density: 0.4, risk_level: "medium" },
    "Seating 200 Level": { type: "seating", capacity: 25000, occupancy: 9500, flow_rate: 300, wait_time: 0, density: 0.38, risk_level: "low" },
    "Seating 300 Level": { type: "seating", capacity: 20000, occupancy: 8000, flow_rate: 250, wait_time: 0, density: 0.4, risk_level: "medium" },
    "Metro Station": { type: "transit", capacity: 15000, occupancy: 2000, flow_rate: 220, wait_time: 8, density: 0.13, risk_level: "low" },
    "West Shuttle Lot": { type: "transit", capacity: 8000, occupancy: 800, flow_rate: 120, wait_time: 4, density: 0.1, risk_level: "low" },
    "East Rideshare Zone": { type: "transit", capacity: 6000, occupancy: 600, flow_rate: 90, wait_time: 5, density: 0.1, risk_level: "low" }
  });
  
  const [gateStatuses, setGateStatuses] = useState<Record<string, string>>({
    "Gate A": "open", "Gate B": "open", "Gate C": "open", "Gate D": "open", "Gate E": "open", "Gate F": "open"
  });
  
  const [scenario, setScenario] = useState<string>("normal");
  const [speed, setSpeed] = useState<number>(1.0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [attendance, setAttendance] = useState<number>(29500);
  const [maxAttendance] = useState<number>(75000);
  const [matchTime, setMatchTime] = useState<string>("Pre-Match (45 mins to Kickoff)");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([
    { id: "V1", name: "Squad Alpha", zone: "Gate A", status: "idle", task: null },
    { id: "V2", name: "Squad Beta", zone: "Gate C", status: "idle", task: null },
    { id: "V3", name: "Squad Gamma", zone: "Concourse East", status: "idle", task: null },
    { id: "V4", name: "Squad Delta", zone: "Gate F", status: "idle", task: null },
    { id: "V5", name: "Squad Epsilon", zone: "Metro Station", status: "idle", task: null }
  ]);
  
  const [briefing, setBriefing] = useState({
    summary: "Stadium operations are running optimally. Entry flow at all gates is stable. No bottlenecks detected.",
    recommendations: [
      "Maintain standard ticket scanning speeds.",
      "Observe Concourse East concessions.",
      "Ensure Metro Station trains arrive every 6 minutes."
    ],
    risk_level: "low",
    critical_count: 0,
    high_count: 0
  });

  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to backend WebSocket
  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected to CrowdMind AI Backend.");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setZones(data.state.zones);
          setGateStatuses(data.state.gate_statuses);
          setScenario(data.state.scenario);
          setSpeed(data.state.speed);
          setIncidents(data.state.incidents);
          setAttendance(data.state.attendance);
          setMatchTime(data.state.match_time);
          setVolunteers(data.state.volunteers);
          setBriefing(data.briefing);
          setPredictions(data.predictions);
        } catch (e) {
          console.error("Failed to parse WebSocket state:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected. Retrying in 5s...");
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Dispatch API trigger helpers
  const handleSimulationControl = async (newScenario: string, newSpeed: number) => {
    try {
      const response = await fetch(`${getApiBase()}/api/simulation/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: newScenario, speed: newSpeed })
      });
      const data = await response.json();
      if (data.status === "success") {
        setScenario(newScenario);
        setSpeed(newSpeed);
      }
    } catch (e) {
      console.warn("Rest call failed. Falling back locally.", e);
      setScenario(newScenario);
      setSpeed(newSpeed);
      
      // Local backup logic
      if (newScenario === "evacuation") {
        setMatchTime("EMERGENCY - EVACUATE IMMEDIATELY");
        setIncidents([{
          id: "local_evac",
          type: "security",
          severity: "critical",
          zone: "Seating 100 Level",
          message: "Local Evacuation alarm triggered."
        }]);
      } else {
        setMatchTime("Pre-Match (45 mins to Kickoff)");
        setIncidents([]);
      }
    }
  };

  const handleGateControl = async (gate: string, status: string) => {
    try {
      await fetch(`${getApiBase()}/api/security/gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate, status })
      });
    } catch (e) {
      console.warn("Gate control failed. Fallback locally.");
      setGateStatuses((prev) => ({ ...prev, [gate]: status }));
    }
  };

  const handleVolunteerDispatch = async (volId: string, zone: string, task: string) => {
    try {
      await fetch(`${getApiBase()}/api/volunteer/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteer_id: volId, zone, task })
      });
    } catch (e) {
      console.warn("Volunteer dispatch failed. Fallback locally.");
      setVolunteers((prev) => 
        prev.map((vol) => vol.id === volId ? { ...vol, zone, status: "dispatched", task } : vol)
      );
    }
  };

  const handleReportIncident = async (type: string, severity: string, zone: string, message: string) => {
    try {
      await fetch(`${getApiBase()}/api/security/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, severity, zone, message })
      });
    } catch (e) {
      console.warn("Incident report failed. Fallback locally.");
      const newInc = { id: `local_${Date.now()}`, type, severity, zone, message };
      setIncidents((prev) => [...prev, newInc]);
    }
  };

  const handleResolveIncident = async (incId: string) => {
    try {
      await fetch(`${getApiBase()}/api/security/incident/resolve/${incId}`, {
        method: "POST"
      });
    } catch (e) {
      console.warn("Incident resolve failed. Fallback locally.");
      setIncidents((prev) => prev.filter((inc) => inc.id !== incId));
    }
  };

  const handleTriggerEvacuation = async (trigger: boolean) => {
    try {
      await fetch(`${getApiBase()}/api/security/evacuate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trigger)
      });
      // Correct fetch formatting for query params
      await fetch(`${getApiBase()}/api/security/evacuate?trigger=${trigger}`, {
        method: "POST"
      });
    } catch (e) {
      console.warn("Evacuation toggle failed. Fallback locally.");
      handleSimulationControl(trigger ? "evacuation" : "normal", speed);
    }
  };

  const isEvacuation = scenario === "evacuation";

  // Gate list for helper bindings
  const gateWaitTimes = Object.entries(zones)
    .filter(([_, data]) => data.type === "gate")
    .reduce((acc, [name, data]) => ({ ...acc, [name]: data.wait_time }), {} as Record<string, number>);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      
      {/* EMERGENCY TICKER BANNER */}
      {isEvacuation && (
        <div className="evac-banner">
          <div className="evac-ticker">
            🚨 EMERGENCY EVACUATION ACTIVE. STADIUM SENSORS DETECT THREAT AT SEATING BOWL. PROCEED CALMLY TO YOUR NEAREST EXIT GATES A-F. ALL LOCKDOWN SYSTEMS OVERRIDDEN. FOLLOW INSTRUCTIONS FROM EMERGENCY PERSONNEL.
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header 
        style={{ 
          height: "70px", 
          padding: "0 20px", 
          background: "var(--bg-tertiary)", 
          borderBottom: "1px solid var(--border-color)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
            🏟️ CROWDMIND <span style={{ color: "var(--accent-blue)" }}>AI</span>
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>FIFA World Cup 2026 Stadium Decision Intelligence</p>
        </div>

        {/* ROLE BAR SWITCHER */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "4px", border: "1px solid var(--border-color)" }}>
          <button 
            onClick={() => setRole("ops")}
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "none", 
              background: role === "ops" ? "var(--accent-blue)" : "none", 
              color: "white", 
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            Operations
          </button>
          <button 
            onClick={() => setRole("fan")}
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "none", 
              background: role === "fan" ? "var(--accent-blue)" : "none", 
              color: "white", 
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            Fan Portal
          </button>
          <button 
            onClick={() => setRole("volunteer")}
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "none", 
              background: role === "volunteer" ? "var(--accent-blue)" : "none", 
              color: "white", 
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            Volunteers
          </button>
          <button 
            onClick={() => setRole("security")}
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "none", 
              background: role === "security" ? "var(--accent-blue)" : "none", 
              color: "white", 
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            Security
          </button>
          <button 
            onClick={() => setRole("transport")}
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "none", 
              background: role === "transport" ? "var(--accent-blue)" : "none", 
              color: "white", 
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            Transport
          </button>
        </div>

        {/* CONNECTION STATUS */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span 
            style={{ 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              background: connected ? "var(--accent-green)" : "var(--accent-orange)" 
            }} 
            className="pulse-active" 
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {connected ? "Live WebSocket Stream" : "Backup Simulation Active"}
          </span>
        </div>
      </header>

      {/* DASHBOARD LAYOUT GRID */}
      <main className="dashboard-grid">
        
        {/* LEFT COLUMN: SIMULATION CONTROLS */}
        <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Simulation Matrix</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Adjust settings to view AI routing dynamically</p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Match Phase Scenario</label>
            <select 
              value={scenario}
              onChange={(e) => handleSimulationControl(e.target.value, speed)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            >
              <option value="normal">Normal Entrance Phase</option>
              <option value="weather_delay">Heavy Storm Delay</option>
              <option value="gate_failure">Gate C Terminal Failure</option>
              <option value="post_match">Post-Match Egress Rush</option>
              <option value="evacuation">Emergency Evacuation</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Simulation Acceleration ({speed}x)
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="5.0" 
              step="0.5"
              value={speed}
              onChange={(e) => handleSimulationControl(scenario, parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-blue)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
              <span>0.5x</span>
              <span>1.0x (Normal)</span>
              <span>5.0x (Fast)</span>
            </div>
          </div>

          {/* Incidents Indicator log inside Simulation sidebar */}
          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Live Simulation Injections</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button 
                onClick={() => handleReportIncident("technical", "high", "Gate C", "Gate C Ticket scanner jam: queue building.")}
                style={{ width: "100%", padding: "6px", fontSize: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                Inject Scanner Failure (Gate C)
              </button>
              <button 
                onClick={() => handleReportIncident("medical", "medium", "Seating 200 Level", "Medical emergency in section 208.")}
                style={{ width: "100%", padding: "6px", fontSize: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                Inject Medical Case (Section 208)
              </button>
            </div>
          </div>
        </section>

        {/* MIDDLE COLUMN: DIGITAL TWIN MAP */}
        <section style={{ height: "100%" }}>
          <DigitalTwin 
            zones={zones}
            gateStatuses={gateStatuses}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            activeRoute={activeRoute}
          />
        </section>

        {/* RIGHT COLUMN: ROLE-BASED DASHBOARD CARD */}
        <section style={{ overflowY: "auto", height: "100%" }}>
          {role === "ops" && (
            <OpsDashboard 
              attendance={attendance}
              maxAttendance={maxAttendance}
              matchTime={matchTime}
              briefing={briefing}
              predictions={predictions}
              zones={zones}
              activeIncidentsCount={incidents.length}
            />
          )}
          {role === "fan" && (
            <FanDashboard 
              gateWaitTimes={gateWaitTimes}
              onRouteGenerated={setActiveRoute}
              isEvacuation={isEvacuation}
            />
          )}
          {role === "volunteer" && (
            <VolunteerDashboard 
              volunteers={volunteers}
              onDispatch={handleVolunteerDispatch}
              zones={Object.keys(zones).filter((z) => zones[z].type !== "seating")}
            />
          )}
          {role === "security" && (
            <SecurityDashboard 
              gateStatuses={gateStatuses}
              onGateControl={handleGateControl}
              incidents={incidents}
              onReportIncident={handleReportIncident}
              onResolveIncident={handleResolveIncident}
              isEvacuation={isEvacuation}
              onTriggerEvacuation={handleTriggerEvacuation}
              zones={Object.keys(zones)}
            />
          )}
          {role === "transport" && (
            <TransportDashboard 
              zones={zones}
              scenario={scenario}
            />
          )}
        </section>

      </main>
    </div>
  );
}
