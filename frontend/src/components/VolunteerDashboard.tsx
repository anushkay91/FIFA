// src/components/VolunteerDashboard.tsx
import React, { useState } from "react";
import type { Volunteer } from "../types";

interface VolunteerDashboardProps {
  volunteers: Volunteer[];
  onDispatch: (volId: string, zone: string, task: string) => void;
  zones: string[];
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = React.memo(({
  volunteers,
  onDispatch,
  zones
}) => {
  const [selectedVol, setSelectedVol] = useState<string>(volunteers[0]?.id || "");
  const [selectedZone, setSelectedZone] = useState<string>("Gate C");
  const [taskText, setTaskText] = useState<string>("Support ticket validation and divert arriving fans to Gate B.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVol || !selectedZone || !taskText) return;
    onDispatch(selectedVol, selectedZone, taskText);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Squad Status Overview */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Volunteer Squad Status</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {volunteers.map((vol) => (
            <div 
              key={vol.id} 
              style={{ 
                padding: "12px", 
                borderRadius: "10px", 
                background: "rgba(255,255,255,0.02)", 
                border: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{vol.name}</strong>
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--accent-blue)", marginTop: "2px" }}>
                  📍 Current: {vol.zone}
                </span>
                {vol.task && (
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", fontStyle: "italic" }}>
                    📋 Task: {vol.task}
                  </span>
                )}
              </div>
              <div>
                <span 
                  style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: "bold", 
                    textTransform: "uppercase",
                    padding: "3px 8px", 
                    borderRadius: "4px",
                    background: vol.status === "dispatched" ? "rgba(10, 132, 255, 0.15)" : "rgba(255,255,255,0.05)",
                    color: vol.status === "dispatched" ? "var(--accent-blue)" : "var(--text-muted)",
                    border: vol.status === "dispatched" ? "1px solid rgba(10, 132, 255, 0.3)" : "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  {vol.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Controller */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Manual AI-Agent Dispatch</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label htmlFor="volunteer-squad" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Select Volunteer Squad</label>
            <select 
              id="volunteer-squad"
              value={selectedVol} 
              onChange={(e) => setSelectedVol(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              aria-label="Select Volunteer Squad"
            >
              {volunteers.map((vol) => (
                <option key={vol.id} value={vol.id}>{vol.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="volunteer-zone" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Target Deployment Zone</label>
            <select 
              id="volunteer-zone"
              value={selectedZone} 
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              aria-label="Target Deployment Zone"
            >
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="volunteer-task" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Task Assignment Directives</label>
            <textarea 
              id="volunteer-task"
              value={taskText} 
              onChange={(e) => setTaskText(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "0.85rem", resize: "none" }}
              aria-label="Task Assignment Directives"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            style={{ width: "100%", marginTop: "5px" }}
            aria-label="Dispatch Squad Directives"
          >
            Dispatch Directives
          </button>
        </form>
      </div>
    </div>
  );
});

VolunteerDashboard.displayName = "VolunteerDashboard";
