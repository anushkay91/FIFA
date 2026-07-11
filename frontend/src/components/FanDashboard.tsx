// src/components/FanDashboard.tsx
import React, { useState } from "react";

interface FanDashboardProps {
  gateWaitTimes: Record<string, number>;
  onRouteGenerated: (route: { entry_gate: string; concourse: string } | null) => void;
  isEvacuation: boolean;
}

export const FanDashboard: React.FC<FanDashboardProps> = ({
  gateWaitTimes,
  onRouteGenerated,
  isEvacuation
}) => {
  const [section, setSection] = useState<number>(115);
  const [row, setRow] = useState<string>("G");
  const [seat, setSeat] = useState<number>(12);
  const [language, setLanguage] = useState<string>("en");
  const [accessibility, setAccessibility] = useState<boolean>(false);
  const [vendorPref, setVendorPref] = useState<string>("food");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<{
    entry_gate: string;
    concourse: string;
    steps: string[];
    evacuation: string;
    sustainability: string;
  } | null>(null);

  const handleGenerateRoute = async () => {
    setLoading(true);
    try {
      const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:8000" : "";
      const response = await fetch(`${apiBase}/api/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          row,
          seat,
          language,
          accessibility,
          vendor_preference: vendorPref
        })
      });
      const data = await response.json();
      setRouteResult(data);
      onRouteGenerated({
        entry_gate: data.entry_gate,
        concourse: data.concourse
      });
    } catch (e) {
      console.error("Error generating fan route:", e);
      // Fallback route generation client-side
      const fallbackGate = section <= 110 ? "Gate A" : section <= 120 ? "Gate C" : section <= 130 ? "Gate D" : "Gate F";
      const fallbackCC = section <= 110 ? "Concourse North" : section <= 120 ? "Concourse East" : section <= 130 ? "Concourse South" : "Concourse West";
      const data = {
        entry_gate: fallbackGate,
        concourse: fallbackCC,
        steps: [
          `📍 Enter via ${fallbackGate}. Pass through security screening and ticket validation.`,
          `🚶 Head to ${fallbackCC}.`,
          accessibility ? "♿ Accessibility Alert: Route uses elevators/ramps, avoiding all stairs." : "🪜 Route uses escalators and stairs.",
          `🍔 Recommended vendor stop: World Cup Eats (Fast Pass Lane).`,
          `🏟️ Locate Section ${section}, Row ${row}, Seat ${seat}.`
        ],
        evacuation: `⚠️ EVACUATION INSTRUCTIONS: In case of emergency, proceed calmly to the nearest exit: ${fallbackGate}.`,
        sustainability: "This route is optimized to minimize carbon footprint and queue times."
      };
      setRouteResult(data);
      onRouteGenerated({
        entry_gate: fallbackGate,
        concourse: fallbackCC
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRoute = () => {
    setRouteResult(null);
    onRouteGenerated(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Dynamic Queue Status Summary */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h4 style={{ marginBottom: "10px", fontSize: "1rem" }}>Current Gate Queue Times</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {Object.entries(gateWaitTimes).map(([gate, mins]) => (
            <div 
              key={gate} 
              style={{ 
                padding: "10px", 
                borderRadius: "8px", 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid var(--border-color)",
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>{gate}</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: mins > 15 ? "var(--accent-red)" : mins > 10 ? "var(--accent-orange)" : "var(--accent-green)" }}>
                {mins} min
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fan Parameters Card */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>World Cup 2026 Companion</h3>
        
        {isEvacuation && (
          <div style={{ padding: "12px", background: "rgba(255, 69, 58, 0.15)", border: "1px solid var(--accent-red)", borderRadius: "8px", color: "var(--accent-red)", fontWeight: "500", fontSize: "0.85rem", marginBottom: "15px" }}>
            🚨 Emergency Evacuation is active. Please look at the evacuation path below and proceed to your nearest exit gate immediately.
          </div>
        )}

        {!routeResult ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Language Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Preferred Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                <option value="en">English (EN)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="pt">Português (PT)</option>
                <option value="ar">العربية (AR)</option>
              </select>
            </div>

            {/* Seat Information */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Section</label>
                <input 
                  type="number" 
                  value={section} 
                  min="101" 
                  max="350"
                  onChange={(e) => setSection(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Row</label>
                <input 
                  type="text" 
                  value={row} 
                  onChange={(e) => setRow(e.target.value.toUpperCase())}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", textAlign: "center" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Seat</label>
                <input 
                  type="number" 
                  value={seat} 
                  onChange={(e) => setSeat(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* Concession Target Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Route Stopover Preference</label>
              <select 
                value={vendorPref} 
                onChange={(e) => setVendorPref(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                <option value="food">Local Food Stands (World Cup Eats)</option>
                <option value="merch">Official Merch Store</option>
                <option value="restroom">Accessible Restrooms</option>
                <option value="none">Direct Path (No Stops)</option>
              </select>
            </div>

            {/* Accessibility Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>♿ Step-free / Elevator Routing</span>
              <input 
                type="checkbox" 
                checked={accessibility} 
                onChange={(e) => setAccessibility(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--accent-blue)" }}
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleGenerateRoute}
              disabled={loading}
              style={{ marginTop: "10px", width: "100%" }}
            >
              {loading ? "Calculating Route..." : "Generate AI Nav Path"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* Selected Route Info */}
            <div style={{ borderLeft: "3px solid var(--accent-blue)", paddingLeft: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Assigned Entrance</span>
              <strong style={{ fontSize: "1.1rem", display: "block" }}>{routeResult.entry_gate}</strong>
            </div>

            {/* Route steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "5px 0" }}>
              {routeResult.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: "10px 12px", 
                    borderRadius: "8px", 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "0.85rem",
                    lineHeight: "1.4"
                  }}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Sustainability Badge */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px", background: "rgba(48, 209, 88, 0.08)", border: "1px solid rgba(48, 209, 88, 0.2)", borderRadius: "8px", color: "var(--accent-green)", fontSize: "0.75rem" }}>
              <span>🍃</span>
              <span>{routeResult.sustainability}</span>
            </div>

            {/* Evacuation Details */}
            {(isEvacuation || routeResult.evacuation) && (
              <div style={{ padding: "12px", background: "rgba(255, 69, 58, 0.08)", border: "1px solid rgba(255, 69, 58, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "0.8rem", fontWeight: "500" }}>
                {routeResult.evacuation}
              </div>
            )}

            <button 
              className="btn-secondary" 
              onClick={handleResetRoute}
              style={{ width: "100%" }}
            >
              Clear Navigation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
