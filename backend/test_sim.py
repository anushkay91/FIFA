# backend/test_sim.py
import sys
import os

# Append current directory to import paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.simulation import StadiumSimulation
from backend.agents import CrowdIntelligenceAgent, OperationsCopilotAgent

def run_tests():
    print("==================================================")
    print("   Running CrowdMind AI Simulation Test Engine    ")
    print("==================================================")
    
    # 1. Initialize Simulator
    sim = StadiumSimulation()
    crowd_agent = CrowdIntelligenceAgent()
    ops_copilot = OperationsCopilotAgent()
    
    print("[OK] Simulator initialized successfully.")
    
    # 2. Check initial state
    state = sim.get_state()
    assert state["attendance"] == 29500, "Initial attendance should be 29500"
    print("[OK] Initial attendance validated (29500).")
    
    # 3. Perform 5 simulation ticks
    print("\nTicking simulation 5 steps (Normal Entrance Scenario)...")
    for i in range(5):
        sim.step()
    
    new_state = sim.get_state()
    print(f"[OK] Ticked simulation. Current attendance: {new_state['attendance']}")
    assert new_state["attendance"] > 29500, "Attendance should increase in normal scenario entrance."
    
    # 4. Check Forecasting
    predictions = crowd_agent.predict_congestion(new_state)
    assert len(predictions) > 0, "Congestion predictions should not be empty."
    print("[OK] Crowd Intelligence forecasting generated forecast records.")
    
    # 5. Check Copilot
    briefing = ops_copilot.generate_briefing(new_state, predictions)
    assert "summary" in briefing and len(briefing["recommendations"]) > 0, "Ops Copilot should output summaries & recommendations."
    print(f"[OK] Operations Copilot generated briefing: '{briefing['summary'][:60]}...'")
    print(f"[OK] Recommendations count: {len(briefing['recommendations'])}")
    
    # 6. Test Scenario Switching
    print("\nSwitching scenario to 'gate_failure'...")
    sim.set_scenario("gate_failure")
    assert sim.gate_statuses["Gate C"] == "slowed", "Gate C status should be slowed in gate failure scenario"
    print("[OK] Gate C slow status verified.")
    
    sim.step()
    gate_c_wait = sim.zones["Gate C"]["wait_time"]
    print(f"[OK] Gate C wait time after failure tick: {gate_c_wait} mins")
    
    print("\n==================================================")
    print("        ALL TEST CASES PASSED SUCCESSFULLY        ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
