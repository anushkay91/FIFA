// src/components/DigitalTwin.tsx
import React from "react";

interface ZoneData {
  type: string;
  capacity: number;
  occupancy: number;
  flow_rate: number;
  wait_time: number;
  density: number;
  risk_level: string;
}

interface DigitalTwinProps {
  zones: Record<string, ZoneData>;
  gateStatuses: Record<string, string>;
  selectedZone: string | null;
  setSelectedZone: (zone: string | null) => void;
  activeRoute: {
    entry_gate: string;
    concourse: string;
  } | null;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  zones,
  gateStatuses,
  selectedZone,
  setSelectedZone,
  activeRoute
}) => {
  // Return HSL or Hex color matching density
  const getZoneColor = (zoneName: string) => {
    const data = zones[zoneName];
    if (!data) return "rgba(255, 255, 255, 0.05)";
    
    // Check gate lockdowns first
    if (data.type === "gate" && gateStatuses[zoneName] === "locked") {
      return "rgba(255, 69, 58, 0.9)"; // Deep red for lock
    }
    if (data.type === "gate" && gateStatuses[zoneName] === "slowed") {
      return "rgba(255, 159, 10, 0.85)"; // Orange/Amber
    }

    const density = data.density;
    if (density < 0.4) {
      return "rgba(48, 209, 88, 0.4)"; // Green with transparency
    } else if (density < 0.75) {
      return "rgba(255, 214, 10, 0.5)"; // Yellow
    } else if (density < 0.9) {
      return "rgba(255, 159, 10, 0.6)"; // Orange
    } else {
      return "rgba(255, 69, 58, 0.7)"; // Red
    }
  };

  const getBorderColor = (zoneName: string) => {
    if (selectedZone === zoneName) {
      return "#0a84ff"; // Apple Blue
    }
    const data = zones[zoneName];
    if (data?.risk_level === "critical") return "#ff453a";
    if (data?.risk_level === "high") return "#ff9f0a";
    return "rgba(255, 255, 255, 0.2)";
  };

  // Get active route coordinates
  const getRoutePath = () => {
    if (!activeRoute) return null;
    
    const gate = activeRoute.entry_gate;
    const cc = activeRoute.concourse;
    
    // Mapping of zones to SVG coordinate points
    const coordinates: Record<string, { x: number; y: number }> = {
      "Gate A": { x: 280, y: 65 },
      "Gate B": { x: 520, y: 65 },
      "Gate C": { x: 670, y: 300 },
      "Gate D": { x: 520, y: 535 },
      "Gate E": { x: 280, y: 535 },
      "Gate F": { x: 130, y: 300 },
      "Concourse North": { x: 400, y: 110 },
      "Concourse East": { x: 630, y: 300 },
      "Concourse South": { x: 400, y: 490 },
      "Concourse West": { x: 170, y: 300 },
      "Seating 100 Level": { x: 400, y: 220 },
      "Seating 200 Level": { x: 400, y: 180 },
      "Seating 300 Level": { x: 400, y: 140 }
    };
    
    const start = coordinates[gate];
    const mid = coordinates[cc];
    const end = coordinates["Seating 100 Level"]; // Default seating point
    
    if (!start || !mid || !end) return null;
    
    // Smooth quadratic bezier route line
    return `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Stadium Digital Twin</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Real-time Occupancy Map & Fan Routing</p>
        </div>
        <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)" }} /> &lt;40%
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-yellow)" }} /> 40-75%
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-orange)" }} /> 75-90%
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-red)" }} /> &gt;90%
          </span>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: "400px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg 
          viewBox="0 0 800 600" 
          style={{ width: "100%", height: "100%", maxHeight: "520px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}
        >
          {/* Defs for gradients & shadow effects */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a24" />
              <stop offset="100%" stopColor="#0b1a0e" />
            </radialGradient>
          </defs>

          {/* BACKGROUND TRANSIT HUBS */}
          {/* Metro Station (Top-Left) */}
          <g 
            onClick={() => setSelectedZone("Metro Station")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Metro Station"); }}
            tabIndex={0}
            role="button"
            aria-label={`Transit Hub: Metro Station. Wait time: ${zones["Metro Station"]?.wait_time || 0} minutes. Density: ${Math.round((zones["Metro Station"]?.density || 0) * 100)} percent.`}
            style={{ cursor: "pointer" }}
          >
            <rect x="30" y="30" width="100" height="60" rx="8" fill={getZoneColor("Metro Station")} stroke={getBorderColor("Metro Station")} strokeWidth={selectedZone === "Metro Station" ? "2" : "1"} />
            <text x="80" y="65" fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="500">🚇 METRO</text>
          </g>

          {/* West Shuttle Lot (Bottom-Left) */}
          <g 
            onClick={() => setSelectedZone("West Shuttle Lot")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("West Shuttle Lot"); }}
            tabIndex={0}
            role="button"
            aria-label={`Transit Hub: West Shuttle Parking. Wait time: ${zones["West Shuttle Lot"]?.wait_time || 0} minutes. Density: ${Math.round((zones["West Shuttle Lot"]?.density || 0) * 100)} percent.`}
            style={{ cursor: "pointer" }}
          >
            <rect x="30" y="510" width="100" height="60" rx="8" fill={getZoneColor("West Shuttle Lot")} stroke={getBorderColor("West Shuttle Lot")} strokeWidth={selectedZone === "West Shuttle Lot" ? "2" : "1"} />
            <text x="80" y="545" fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="500">🚌 SHUTTLES</text>
          </g>

          {/* East Rideshare Zone (Right) */}
          <g 
            onClick={() => setSelectedZone("East Rideshare Zone")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("East Rideshare Zone"); }}
            tabIndex={0}
            role="button"
            aria-label={`Transit Hub: East Rideshare Pick-up. Wait time: ${zones["East Rideshare Zone"]?.wait_time || 0} minutes. Density: ${Math.round((zones["East Rideshare Zone"]?.density || 0) * 100)} percent.`}
            style={{ cursor: "pointer" }}
          >
            <rect x="670" y="150" width="100" height="60" rx="8" fill={getZoneColor("East Rideshare Zone")} stroke={getBorderColor("East Rideshare Zone")} strokeWidth={selectedZone === "East Rideshare Zone" ? "2" : "1"} />
            <text x="720" y="185" fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="500">🚗 RIDESHARE</text>
          </g>

          {/* OUTER CONTEXT GATES (Circles around Stadium Boundary) */}
          {/* Gate A (North West) */}
          <circle 
            cx="280" cy="65" r="16" 
            fill={getZoneColor("Gate A")} 
            stroke={getBorderColor("Gate A")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate A")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate A"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate A. Wait time: ${zones["Gate A"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate A"] || "open"}.`}
          />
          <text x="280" y="69" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">A</text>
          
          {/* Gate B (North East) */}
          <circle 
            cx="520" cy="65" r="16" 
            fill={getZoneColor("Gate B")} 
            stroke={getBorderColor("Gate B")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate B")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate B"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate B. Wait time: ${zones["Gate B"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate B"] || "open"}.`}
          />
          <text x="520" y="69" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">B</text>

          {/* Gate C (East) */}
          <circle 
            cx="670" cy="300" r="16" 
            fill={getZoneColor("Gate C")} 
            stroke={getBorderColor("Gate C")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate C")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate C"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate C. Wait time: ${zones["Gate C"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate C"] || "open"}.`}
          />
          <text x="670" y="304" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">C</text>

          {/* Gate D (South East) */}
          <circle 
            cx="520" cy="535" r="16" 
            fill={getZoneColor("Gate D")} 
            stroke={getBorderColor("Gate D")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate D")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate D"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate D. Wait time: ${zones["Gate D"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate D"] || "open"}.`}
          />
          <text x="520" y="539" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">D</text>

          {/* Gate E (South West) */}
          <circle 
            cx="280" cy="535" r="16" 
            fill={getZoneColor("Gate E")} 
            stroke={getBorderColor("Gate E")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate E")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate E"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate E. Wait time: ${zones["Gate E"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate E"] || "open"}.`}
          />
          <text x="280" y="539" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">E</text>

          {/* Gate F (West) */}
          <circle 
            cx="130" cy="300" r="16" 
            fill={getZoneColor("Gate F")} 
            stroke={getBorderColor("Gate F")} 
            strokeWidth="2" 
            className="map-zone" 
            onClick={() => setSelectedZone("Gate F")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Gate F"); }}
            tabIndex={0}
            role="button"
            aria-label={`Gate Terminal: Gate F. Wait time: ${zones["Gate F"]?.wait_time || 0} minutes. Status: ${gateStatuses["Gate F"] || "open"}.`}
          />
          <text x="130" y="304" fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">F</text>

          {/* CONCOURSES */}
          {/* Concourse North */}
          <rect 
            x="250" y="100" width="300" height="35" rx="6" 
            fill={getZoneColor("Concourse North")} 
            stroke={getBorderColor("Concourse North")} 
            strokeWidth={selectedZone === "Concourse North" ? "2" : "1"} 
            className="map-zone" 
            onClick={() => setSelectedZone("Concourse North")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Concourse North"); }}
            tabIndex={0}
            role="button"
            aria-label={`Concourse Corridor: Concourse North. Occupancy: ${zones["Concourse North"]?.occupancy.toLocaleString() || 0} fans. Density: ${Math.round((zones["Concourse North"]?.density || 0) * 100)} percent.`}
          />
          <text x="400" y="122" fill="var(--text-primary)" fontSize="10" textAnchor="middle" pointerEvents="none" fontWeight="500">CONCOURSE NORTH</text>

          {/* Concourse South */}
          <rect 
            x="250" y="465" width="300" height="35" rx="6" 
            fill={getZoneColor("Concourse South")} 
            stroke={getBorderColor("Concourse South")} 
            strokeWidth={selectedZone === "Concourse South" ? "2" : "1"} 
            className="map-zone" 
            onClick={() => setSelectedZone("Concourse South")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Concourse South"); }}
            tabIndex={0}
            role="button"
            aria-label={`Concourse Corridor: Concourse South. Occupancy: ${zones["Concourse South"]?.occupancy.toLocaleString() || 0} fans. Density: ${Math.round((zones["Concourse South"]?.density || 0) * 100)} percent.`}
          />
          <text x="400" y="487" fill="var(--text-primary)" fontSize="10" textAnchor="middle" pointerEvents="none" fontWeight="500">CONCOURSE SOUTH</text>

          {/* Concourse East */}
          <rect 
            x="590" y="170" width="35" height="260" rx="6" 
            fill={getZoneColor("Concourse East")} 
            stroke={getBorderColor("Concourse East")} 
            strokeWidth={selectedZone === "Concourse East" ? "2" : "1"} 
            className="map-zone" 
            onClick={() => setSelectedZone("Concourse East")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Concourse East"); }}
            tabIndex={0}
            role="button"
            aria-label={`Concourse Corridor: Concourse East. Occupancy: ${zones["Concourse East"]?.occupancy.toLocaleString() || 0} fans. Density: ${Math.round((zones["Concourse East"]?.density || 0) * 100)} percent.`}
          />
          <text x="608" y="300" fill="var(--text-primary)" fontSize="10" textAnchor="middle" transform="rotate(-90, 608, 300)" pointerEvents="none" fontWeight="500">CONCOURSE EAST</text>

          {/* Concourse West */}
          <rect 
            x="175" y="170" width="35" height="260" rx="6" 
            fill={getZoneColor("Concourse West")} 
            stroke={getBorderColor("Concourse West")} 
            strokeWidth={selectedZone === "Concourse West" ? "2" : "1"} 
            className="map-zone" 
            onClick={() => setSelectedZone("Concourse West")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Concourse West"); }}
            tabIndex={0}
            role="button"
            aria-label={`Concourse Corridor: Concourse West. Occupancy: ${zones["Concourse West"]?.occupancy.toLocaleString() || 0} fans. Density: ${Math.round((zones["Concourse West"]?.density || 0) * 100)} percent.`}
          />
          <text x="193" y="300" fill="var(--text-primary)" fontSize="10" textAnchor="middle" transform="rotate(90, 193, 300)" pointerEvents="none" fontWeight="500">CONCOURSE WEST</text>

          {/* SEATING BOWLS (Concentric Rings) */}
          {/* Seating 300 Level */}
          <path 
            d="M 270 200 A 150 120 0 1 1 530 200 A 150 120 0 1 1 270 200 Z" 
            fill="none" 
            stroke={getZoneColor("Seating 300 Level")} 
            strokeWidth="28" 
            className="map-zone"
            onClick={() => setSelectedZone("Seating 300 Level")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Seating 300 Level"); }}
            tabIndex={0}
            role="button"
            aria-label={`Stadium Seating: Upper 300 Level. Occupancy: ${zones["Seating 300 Level"]?.occupancy.toLocaleString() || 0} fans. Capacity: ${zones["Seating 300 Level"]?.capacity.toLocaleString() || 0}.`}
          />
          {/* Seating 200 Level */}
          <path 
            d="M 300 220 A 110 85 0 1 1 500 220 A 110 85 0 1 1 300 220 Z" 
            fill="none" 
            stroke={getZoneColor("Seating 200 Level")} 
            strokeWidth="22" 
            className="map-zone"
            onClick={() => setSelectedZone("Seating 200 Level")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Seating 200 Level"); }}
            tabIndex={0}
            role="button"
            aria-label={`Stadium Seating: Mid 200 Level. Occupancy: ${zones["Seating 200 Level"]?.occupancy.toLocaleString() || 0} fans. Capacity: ${zones["Seating 200 Level"]?.capacity.toLocaleString() || 0}.`}
          />
          {/* Seating 100 Level */}
          <path 
            d="M 330 240 A 75 55 0 1 1 470 240 A 75 55 0 1 1 330 240 Z" 
            fill="none" 
            stroke={getZoneColor("Seating 100 Level")} 
            strokeWidth="18" 
            className="map-zone"
            onClick={() => setSelectedZone("Seating 100 Level")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedZone("Seating 100 Level"); }}
            tabIndex={0}
            role="button"
            aria-label={`Stadium Seating: Lower 100 Level. Occupancy: ${zones["Seating 100 Level"]?.occupancy.toLocaleString() || 0} fans. Capacity: ${zones["Seating 100 Level"]?.capacity.toLocaleString() || 0}.`}
          />

          {/* Inner Field Pitch */}
          <rect x="360" y="260" width="80" height="80" rx="4" fill="url(#fieldGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" pointerEvents="none" />
          <line x1="400" y1="260" x2="400" y2="340" stroke="rgba(255,255,255,0.2)" pointerEvents="none" />
          <circle cx="400" cy="300" r="12" fill="none" stroke="rgba(255,255,255,0.2)" pointerEvents="none" />

          {/* ACTIVE FAN ROUTE OVERLAY */}
          {activeRoute && getRoutePath() && (
            <>
              {/* Route line glow effect */}
              <path 
                d={getRoutePath() || ""} 
                fill="none" 
                stroke="rgba(10, 132, 255, 0.4)" 
                strokeWidth="8" 
                filter="url(#glow)"
                pointerEvents="none"
              />
              {/* Core animated route line */}
              <path 
                d={getRoutePath() || ""} 
                fill="none" 
                stroke="#0a84ff" 
                strokeWidth="4" 
                className="map-route-path"
                pointerEvents="none"
              />
              {/* Pulsing indicator at Gate */}
              <circle 
                cx={activeRoute.entry_gate === "Gate C" ? 670 : activeRoute.entry_gate === "Gate F" ? 130 : activeRoute.entry_gate === "Gate A" ? 280 : activeRoute.entry_gate === "Gate B" ? 520 : activeRoute.entry_gate === "Gate D" ? 520 : 280} 
                cy={activeRoute.entry_gate === "Gate C" ? 300 : activeRoute.entry_gate === "Gate F" ? 300 : activeRoute.entry_gate === "Gate A" ? 65 : activeRoute.entry_gate === "Gate B" ? 65 : activeRoute.entry_gate === "Gate D" ? 535 : 535} 
                r="10" 
                fill="none" 
                stroke="#0a84ff" 
                strokeWidth="3" 
                className="pulse-active" 
                pointerEvents="none"
              />
            </>
          )}
        </svg>

        {/* Selected Zone Float Card */}
        {selectedZone && zones[selectedZone] && (
          <div 
            className="glass-panel" 
            style={{ 
              position: "absolute", 
              bottom: "10px", 
              left: "10px", 
              right: "10px", 
              background: "rgba(10, 15, 30, 0.95)", 
              padding: "12px", 
              borderRadius: "10px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              zIndex: 10
            }}
          >
            <div>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block" }}>
                {zones[selectedZone].type} zone details
              </span>
              <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>{selectedZone}</strong>
            </div>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)" }}>Occupancy</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                  {zones[selectedZone].occupancy.toLocaleString()} / {zones[selectedZone].capacity.toLocaleString()}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)" }}>Density</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: zones[selectedZone].density > 0.9 ? "var(--accent-red)" : zones[selectedZone].density > 0.75 ? "var(--accent-orange)" : "var(--accent-green)" }}>
                  {Math.round(zones[selectedZone].density * 100)}%
                </span>
              </div>
              {zones[selectedZone].type === "gate" && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)" }}>Wait Time</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--accent-blue)" }}>
                    {zones[selectedZone].wait_time} min
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setSelectedZone(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", padding: "0 5px" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
