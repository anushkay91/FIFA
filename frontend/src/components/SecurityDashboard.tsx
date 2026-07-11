// src/components/SecurityDashboard.tsx
import React, { useState } from "react";

interface Incident {
  id: string;
  type: string;
  severity: string;
  zone: string;
  message: string;
}

interface SecurityDashboardProps {
  gateStatuses: Record<string, string>;
  onGateControl: (gate: string, status: string) => void;
  incidents: Incident[];
  onReportIncident: (type: string, severity: string, zone: string, msg: string) => void;
  onResolveIncident: (incId: string) => void;
  isEvacuation: boolean;
  onTriggerEvacuation: (trigger: boolean) => void;
  zones: string[];
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  gateStatuses,
  onGateControl,
  incidents,
  onReportIncident,
  onResolveIncident,
  isEvacuation,
  onTriggerEvacuation,
  zones
}) => {
  const [incType, setIncType] = useState<string>("security");
  const [incSeverity, setIncSeverity] = useState<string>("medium");
  const [incZone, setIncZone] = useState<string>("Gate C");
  const [incMsg, setIncMsg] = useState<string>("Concession queue overflow spilling into security checkpoint.");

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incMsg) return;
    onReportIncident(incType, incSeverity, incZone, incMsg);
    setIncMsg("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* CCTV / Gate Control Panel */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }} className="pulse-active" />
          CCTV & Gate Access Terminals
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.entries(gateStatuses).map(([gate, status]) => (
            <div 
              key={gate}
              style={{ 
                padding: "10px 12px", 
                borderRadius: "8px", 
                background: "rgba(255,255,255,0.02)", 
                border: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{gate}</span>
                <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Status: <strong style={{ color: status === "open" ? "var(--accent-green)" : status === "slowed" ? "var(--accent-orange)" : "var(--accent-red)" }}>{status.toUpperCase()}</strong>
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button 
                  onClick={() => onGateControl(gate, "open")}
                  style={{ 
                    fontSize: "0.7rem", 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    background: status === "open" ? "rgba(48, 209, 88, 0.15)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: status === "open" ? "var(--accent-green)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  OPEN
                </button>
                <button 
                  onClick={() => onGateControl(gate, "slowed")}
                  style={{ 
                    fontSize: "0.7rem", 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    background: status === "slowed" ? "rgba(255, 159, 10, 0.15)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: status === "slowed" ? "var(--accent-orange)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  SLOW
                </button>
                <button 
                  onClick={() => onGateControl(gate, "locked")}
                  style={{ 
                    fontSize: "0.7rem", 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    background: status === "locked" ? "rgba(255, 69, 58, 0.15)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: status === "locked" ? "var(--accent-red)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  LOCK
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Control Toggle */}
      <div 
        className="glass-panel pulse-critical" 
        style={{ 
          padding: "20px", 
          background: "rgba(255, 69, 58, 0.05)", 
          border: "1px solid var(--accent-red)",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}
      >
        <div>
          <h4 style={{ fontSize: "1rem", color: "var(--accent-red)", fontWeight: "bold" }}>Emergency Evacuation</h4>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Override all routes & open exit gates</span>
        </div>
        <button 
          onClick={() => onTriggerEvacuation(!isEvacuation)}
          style={{ 
            background: isEvacuation ? "var(--text-primary)" : "var(--accent-red)", 
            color: isEvacuation ? "var(--accent-red)" : "var(--text-primary)", 
            border: "none", 
            padding: "8px 16px", 
            borderRadius: "6px", 
            fontWeight: "bold", 
            cursor: "pointer",
            fontSize: "0.8rem",
            boxShadow: "0 0 10px rgba(255,69,58,0.4)"
          }}
        >
          {isEvacuation ? "RESET SYSTEM" : "TRIGGER ALARM"}
        </button>
      </div>

      {/* Active Incidents and Log */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Active Incidents</h3>
        {incidents.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
            No active incidents. Stadium is secure.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                style={{ 
                  padding: "10px 12px", 
                  borderRadius: "8px", 
                  background: inc.severity === "critical" ? "rgba(255,69,58,0.08)" : inc.severity === "high" ? "rgba(255,159,10,0.08)" : "rgba(255,255,255,0.02)", 
                  borderLeft: inc.severity === "critical" ? "3px solid var(--accent-red)" : inc.severity === "high" ? "3px solid var(--accent-orange)" : "3px solid var(--text-muted)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ flex: 1, paddingRight: "10px" }}>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {inc.type} | {inc.zone}
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", marginTop: "2px" }}>{inc.message}</p>
                </div>
                <button 
                  onClick={() => onResolveIncident(inc.id)}
                  style={{ 
                    fontSize: "0.7rem", 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    background: "rgba(48,209,88,0.15)", 
                    border: "none", 
                    color: "var(--accent-green)",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  RESOLVE
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Report / Inject Incident */}
        <h4 style={{ fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", paddingTop: "15px", marginBottom: "10px" }}>Simulate / Inject Incident</h4>
        <form onSubmit={handleSubmitIncident} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "3px" }}>Type</label>
              <select 
                value={incType} 
                onChange={(e) => setIncType(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              >
                <option value="security">Security</option>
                <option value="medical">Medical</option>
                <option value="technical">Technical Failure</option>
                <option value="weather">Weather Threat</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "3px" }}>Severity</label>
              <select 
                value={incSeverity} 
                onChange={(e) => setIncSeverity(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "3px" }}>Incident Zone</label>
            <select 
              value={incZone} 
              onChange={(e) => setIncZone(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
            >
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "3px" }}>Message</label>
            <input 
              type="text" 
              value={incMsg} 
              onChange={(e) => setIncMsg(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "0.8rem" }}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: "100%", fontSize: "0.8rem", padding: "8px" }}
          >
            Inject Emergency Alert
          </button>
        </form>
      </div>
    </div>
  );
};
