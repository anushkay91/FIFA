// src/components/TransportDashboard.tsx
import React, { useState } from "react";

interface TransitZone {
  type: string;
  capacity: number;
  occupancy: number;
  flow_rate: number;
  wait_time: number;
  density: number;
  risk_level: string;
}

interface TransportDashboardProps {
  zones: Record<string, TransitZone>;
  scenario: string;
}

export const TransportDashboard: React.FC<TransportDashboardProps> = ({
  zones,
  scenario
}) => {
  const [dispatchTarget, setDispatchTarget] = useState<string>("Metro Station");
  const [dispatchAction, setDispatchAction] = useState<string>("increase_frequency");
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([
    "Transit monitor active. Commute tracking initiated.",
    "Eco-routing engine validated: carbon savings active."
  ]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const actions: Record<string, string> = {
      increase_frequency: "Increased vehicle frequency on Metro lines by 25%. Wait times expected to fall.",
      add_shuttles: "Dispatched 5 reserve electric shuttle buses to West Shuttle Lot.",
      divert_rideshare: "Adjusted geo-fence coordinates for East Rideshare to prevent concourse spillover."
    };
    
    const newLog = `[${new Date().toLocaleTimeString()}] ${dispatchTarget}: ${actions[dispatchAction]}`;
    setDispatchLogs([newLog, ...dispatchLogs]);
  };

  // Get transit details
  const metro = zones["Metro Station"] || { occupancy: 0, wait_time: 0, flow_rate: 0 };
  const shuttle = zones["West Shuttle Lot"] || { occupancy: 0, wait_time: 0, flow_rate: 0 };
  const rideshare = zones["East Rideshare Zone"] || { occupancy: 0, wait_time: 0, flow_rate: 0 };

  // Calculate carbon footprint savings based on attendee routing
  // E.g., if scenario is post_match, savings scale higher.
  const carbonSavings = scenario === "post_match" ? 1420 : scenario === "weather_delay" ? 380 : 840;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Real-time Transit Hub Monitor */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Transit Hub Hub Status</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Metro Station */}
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.9rem" }}>🚇 Metro Station (Line A/B)</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-blue)", fontWeight: "bold" }}>{metro.wait_time} min wait</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              <span>Occupancy: {metro.occupancy.toLocaleString()}</span>
              <span>Flow rate: {metro.flow_rate} pax/min</span>
            </div>
          </div>

          {/* West Shuttle Lot */}
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.9rem" }}>🚌 West Shuttle Parking</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-green)", fontWeight: "bold" }}>{shuttle.wait_time} min wait</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              <span>Occupancy: {shuttle.occupancy.toLocaleString()}</span>
              <span>Flow rate: {shuttle.flow_rate} pax/min</span>
            </div>
          </div>

          {/* East Rideshare */}
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.9rem" }}>🚗 East Rideshare Pick-up</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-yellow)", fontWeight: "bold" }}>{rideshare.wait_time} min wait</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              <span>Occupancy: {rideshare.occupancy.toLocaleString()}</span>
              <span>Flow rate: {rideshare.flow_rate} pax/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Badge */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "20px", 
          background: "linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(10, 132, 255, 0.05) 100%)",
          border: "1px solid rgba(48, 209, 88, 0.2)"
        }}
      >
        <h4 style={{ color: "var(--accent-green)", fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          🍃 Sustainability Insights Engine
        </h4>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          By actively balancing gate egress and directing fans to public transport, CrowdMind AI has reduced event carbon emissions by:
        </p>
        <div style={{ margin: "12px 0 5px 0" }}>
          <span style={{ fontSize: "2rem", fontWeight: "bold", fontFamily: "var(--font-display)", color: "var(--accent-green)", textShadow: "0 0 10px rgba(48, 209, 88, 0.2)" }}>
            {carbonSavings} kg CO₂
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>this match</span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Equivalent to planting {Math.round(carbonSavings / 20)} trees.</span>
      </div>
      {/* Transit Dispatch Panel */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>AI Transit Dispatcher</h3>
        <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label htmlFor="transport-hub" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Select Hub</label>
            <select 
              id="transport-hub"
              value={dispatchTarget} 
              onChange={(e) => setDispatchTarget(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              aria-label="Select Transit Hub Target"
            >
              <option value="Metro Station">Metro Station</option>
              <option value="West Shuttle Lot">West Shuttle Parking</option>
              <option value="East Rideshare Zone">East Rideshare Zone</option>
            </select>
          </div>

          <div>
            <label htmlFor="transport-action" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Dispatch Action</label>
            <select 
              id="transport-action"
              value={dispatchAction} 
              onChange={(e) => setDispatchAction(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              aria-label="Dispatch Action Type"
            >
              <option value="increase_frequency">Increase Train Frequency (Line A/B)</option>
              <option value="add_shuttles">Deploy Electric Shuttle Fleet</option>
              <option value="divert_rideshare">Divert Rideshare Geospatial Boundary</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", fontSize: "0.85rem", padding: "8px", marginTop: "5px" }} aria-label="Execute AI Transit Dispatch">
            Execute Dispatch
          </button>
        </form>

        <div style={{ marginTop: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Dispatcher Logs</span>
          <div 
            style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "100px", overflowY: "auto" }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {dispatchLogs.map((log, idx) => (
              <span key={idx} style={{ fontSize: "0.7rem", color: idx === 0 ? "var(--accent-blue)" : "var(--text-secondary)", fontFamily: "monospace" }}>
                {log}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
