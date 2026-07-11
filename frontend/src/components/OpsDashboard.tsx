// src/components/OpsDashboard.tsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BriefingData {
  summary: string;
  recommendations: string[];
  risk_level: string;
  critical_count: number;
  high_count: number;
}

interface PredictionData {
  predicted_occupancy: number;
  predicted_density: number;
  predicted_wait_time: number;
  predicted_risk: string;
  trend: string;
}

interface ZoneData {
  type: string;
  capacity: number;
  occupancy: number;
  flow_rate: number;
  wait_time: number;
  density: number;
  risk_level: string;
}

interface OpsDashboardProps {
  attendance: number;
  maxAttendance: number;
  matchTime: string;
  briefing: BriefingData;
  predictions: Record<string, PredictionData>;
  zones: Record<string, ZoneData>;
  activeIncidentsCount: number;
}

export const OpsDashboard: React.FC<OpsDashboardProps> = ({
  attendance,
  maxAttendance,
  matchTime,
  briefing,
  predictions,
  zones,
  activeIncidentsCount
}) => {
  
  // Format predictions data for Recharts
  const chartData = Object.entries(zones)
    .filter(([_, data]) => data.type === "gate")
    .map(([name, data]) => {
      const pred = predictions[name] || { predicted_wait_time: data.wait_time };
      return {
        name: name.replace("Gate ", ""),
        current: data.wait_time,
        predicted: pred.predicted_wait_time
      };
    });

  // Calculate Average Wait Time
  const gates = Object.values(zones).filter((z) => z.type === "gate");
  const avgWait = gates.length > 0 ? Math.round(gates.reduce((acc, g) => acc + g.wait_time, 0) / gates.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflowY: "auto", paddingRight: "5px" }}>
      {/* High Level KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <div className="glass-panel" style={{ padding: "12px 15px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Stadium Attendance</span>
          <h4 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "4px 0" }}>
            {attendance.toLocaleString()} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>/ {maxAttendance.toLocaleString()}</span>
          </h4>
          <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginTop: "6px" }}>
            <div style={{ width: `${(attendance / maxAttendance) * 100}%`, height: "100%", background: "var(--accent-blue)", borderRadius: "2px" }} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "12px 15px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Avg Gate Queue</span>
          <h4 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "4px 0", color: avgWait > 12 ? "var(--accent-red)" : avgWait > 7 ? "var(--accent-orange)" : "var(--accent-green)" }}>
            {avgWait} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>mins</span>
          </h4>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Across all 6 ticket terminals</span>
        </div>

        <div className="glass-panel" style={{ padding: "12px 15px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Match Schedule</span>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", margin: "4px 0", color: "var(--text-primary)" }}>
            {matchTime}
          </h4>
        </div>

        <div className="glass-panel" style={{ padding: "12px 15px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Active Incidents</span>
          <h4 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "4px 0", color: activeIncidentsCount > 0 ? "var(--accent-red)" : "var(--text-muted)" }}>
            {activeIncidentsCount}
          </h4>
        </div>
      </div>

      {/* AI Operations Copilot Section */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "20px", 
          borderLeft: briefing.risk_level === "critical" ? "4px solid var(--accent-red)" : briefing.risk_level === "high" ? "4px solid var(--accent-orange)" : "4px solid var(--accent-blue)" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🤖</span> Operations Copilot Agent
          </h3>
          <span 
            style={{ 
              fontSize: "0.7rem", 
              textTransform: "uppercase", 
              fontWeight: "bold", 
              padding: "2px 8px", 
              borderRadius: "4px", 
              background: briefing.risk_level === "critical" ? "rgba(255, 69, 58, 0.15)" : briefing.risk_level === "high" ? "rgba(255, 159, 10, 0.15)" : "rgba(48, 209, 88, 0.15)",
              color: briefing.risk_level === "critical" ? "var(--accent-red)" : briefing.risk_level === "high" ? "var(--accent-orange)" : "var(--accent-green)"
            }}
          >
            {briefing.risk_level} Risk
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "15px" }} id="ops-copilot-briefing">
          {briefing.summary}
        </p>

        <div>
          <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            Actionable Recommendations
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} role="status" aria-live="polite" aria-atomic="true">
            {briefing.recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  gap: "8px", 
                  fontSize: "0.8rem", 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "8px 10px", 
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.04)" 
                }}
              >
                <span style={{ color: "var(--accent-blue)" }} aria-hidden="true">✔</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proactive Forecasting Chart (30 Mins Prediction) */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }} role="region" aria-label="Queue Congestion Forecasting and Wait Times Chart">
        <div>
          <h3 style={{ fontSize: "1rem" }}>Queue Congestion Forecasting</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Compare current vs. predicted wait times (20–40 min forecast)</p>
        </div>

        {/* Visually hidden summary table for WCAG 2.2 chart compliance */}
        <div style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}>
          <table aria-label="Queue Wait Times Forecast Data">
            <thead>
              <tr>
                <th scope="col">Gate Terminal</th>
                <th scope="col">Current Wait (m)</th>
                <th scope="col">Forecasted Wait (m)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name}>
                  <td>Gate {row.name}</td>
                  <td>{row.current} minutes</td>
                  <td>{row.predicted} minutes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: "100%", height: "200px" }} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: "#0b0f19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                labelStyle={{ fontWeight: "bold", color: "var(--text-primary)" }}
              />
              <Bar dataKey="current" name="Current Wait (m)" fill="#30d158" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted" name="Forecasted Wait (m)" fill="#ff9f0a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
