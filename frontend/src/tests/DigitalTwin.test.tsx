import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DigitalTwin } from "../components/DigitalTwin";

const mockZones = {
  "Gate A": { type: "gate", capacity: 8000, occupancy: 1500, flow_rate: 80, wait_time: 5, density: 0.18, risk_level: "low" },
  "Gate B": { type: "gate", capacity: 8000, occupancy: 1200, flow_rate: 75, wait_time: 4, density: 0.15, risk_level: "low" },
};
const mockGateStatuses = {
  "Gate A": "open",
  "Gate B": "open"
};

describe("DigitalTwin Component", () => {
  test("renders stadium title and zone items", () => {
    const setSelectedZone = vi.fn();
    render(
      <DigitalTwin 
        zones={mockZones as any}
        gateStatuses={mockGateStatuses}
        selectedZone={null}
        setSelectedZone={setSelectedZone}
        activeRoute={null}
      />
    );
    
    expect(screen.getByText("Stadium Digital Twin")).toBeDefined();
    // Verify circle labels exist
    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("B")).toBeDefined();
  });
});
