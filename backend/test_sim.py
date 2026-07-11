# backend/test_sim.py
import pytest
from backend.simulation import StadiumSimulation
from backend.agents import (
    CrowdIntelligenceAgent,
    FanAgent,
    OperationsCopilotAgent,
    VolunteerAgent
)

def test_simulator_initialization():
    """Verify simulation is correctly initialized with all standard zones and volunteers."""
    sim = StadiumSimulation()
    state = sim.get_state()
    assert state["attendance"] == 29500
    assert state["scenario"] == "normal"
    assert len(state["zones"]) == 16
    assert len(state["volunteers"]) == 5

def test_simulation_step_forward():
    """Verify that ticking the simulation increases attendance and computes zone densities."""
    sim = StadiumSimulation()
    sim.step()
    state = sim.get_state()
    assert state["attendance"] > 29500
    # Every zone must have density and risk_level computed
    for name, zone in state["zones"].items():
        assert "density" in zone
        assert "risk_level" in zone

def test_crowd_forecasting():
    """Verify that Crowd Intelligence forecasts congestion wait times and risk levels."""
    sim = StadiumSimulation()
    sim.step()
    state = sim.get_state()
    agent = CrowdIntelligenceAgent()
    predictions = agent.predict_congestion(state)
    assert len(predictions) > 0
    for gate in ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"]:
        assert gate in predictions
        assert "predicted_wait_time" in predictions[gate]
        assert "predicted_risk" in predictions[gate]

def test_operations_copilot_briefing():
    """Verify that Operations Copilot generates operational summaries and actionable recommendations."""
    sim = StadiumSimulation()
    sim.step()
    state = sim.get_state()
    crowd_agent = CrowdIntelligenceAgent()
    predictions = crowd_agent.predict_congestion(state)
    ops_agent = OperationsCopilotAgent()
    briefing = ops_agent.generate_briefing(state, predictions)
    assert "summary" in briefing
    assert "recommendations" in briefing
    assert len(briefing["recommendations"]) > 0

def test_scenario_transitions():
    """Verify that matching scenarios inject correct incidents and modify gate statuses."""
    sim = StadiumSimulation()
    
    # Gate Failure Scenario
    sim.set_scenario("gate_failure")
    state = sim.get_state()
    assert state["gate_statuses"]["Gate C"] == "slowed"
    assert len(state["incidents"]) > 0
    assert state["incidents"][0]["zone"] == "Gate C"
    
    # Emergency Evacuation Scenario
    sim.set_scenario("evacuation")
    state = sim.get_state()
    assert state["match_time"] == "EMERGENCY - EVACUATE IMMEDIATELY"
    assert state["gate_statuses"]["Gate A"] == "open"

def test_fan_routing():
    """Verify Fan Agent translates instructions and respects step-free elevator options."""
    agent = FanAgent()
    
    # Test EN language and standard path
    res_en = agent.generate_route(120, "F", 10, "en", False, "none")
    assert res_en["entry_gate"] == "Gate C"
    assert res_en["concourse"] == "Concourse East"
    assert any("Gate C" in step for step in res_en["steps"])
    assert any("escalators and stairs" in step for step in res_en["steps"])
    
    # Test ES language accessibility elevator routing
    res_es = agent.generate_route(105, "C", 5, "es", True, "food")
    assert res_es["entry_gate"] == "Gate A"
    assert any("ascensores" in step for step in res_es["steps"])
    assert any("Eats" in step for step in res_es["steps"])

def test_volunteer_dispatch_logic():
    """Verify Volunteer Agent auto-dispatches safety squads to critical bottleneck locations."""
    sim = StadiumSimulation()
    
    # Trigger gate failure scenario which forces a critical zone queue
    sim.set_scenario("gate_failure")
    # Step multiple times to build wait time and risk levels
    for _ in range(5):
        sim.step()
        
    state = sim.get_state()
    vol_agent = VolunteerAgent()
    dispatched_volunteers = vol_agent.dispatch_squads(state)
    
    # At least one squad should be dispatched to the problematic Gate C or Concourse
    dispatched_squads = [v for v in dispatched_volunteers if v["status"] == "dispatched"]
    assert len(dispatched_squads) > 0
    assert any(v["zone"] == "Gate C" for v in dispatched_squads)
