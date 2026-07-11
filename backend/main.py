# backend/main.py
import asyncio
import json
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.simulation import StadiumSimulation
from backend.agents import (
    CrowdIntelligenceAgent,
    FanAgent,
    OperationsCopilotAgent,
    VolunteerAgent
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CrowdMindAI")

app = FastAPI(title="CrowdMind AI Backend")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
simulation = StadiumSimulation()
crowd_agent = CrowdIntelligenceAgent()
fan_agent = FanAgent()
ops_agent = OperationsCopilotAgent()
volunteer_agent = VolunteerAgent()

# WebSocket Manager to handle multiple connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Connection might be dead, handled by disconnect
                pass

manager = ConnectionManager()

# Background task to step the simulation
simulation_active = True

async def simulation_loop():
    logger.info("Starting simulation loop...")
    while simulation_active:
        try:
            # Step the simulation physics
            simulation.step()
            
            # Run Agent analyses
            state = simulation.get_state()
            predictions = crowd_agent.predict_congestion(state)
            briefing = ops_agent.generate_briefing(state, predictions)
            
            # Volunteer auto-dispatching
            dispatched_volunteers = volunteer_agent.dispatch_squads(state)
            simulation.volunteers = dispatched_volunteers
            
            # Prepare packet
            payload = {
                "state": state,
                "predictions": predictions,
                "briefing": briefing
            }
            
            # Broadcast to all connected WebSockets
            await manager.broadcast(json.dumps(payload))
            
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}", exc_info=True)
            
        # Tick interval: 1 second
        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

@app.on_event("shutdown")
def shutdown_event():
    global simulation_active
    simulation_active = False

# REST API Models
class ControlRequest(BaseModel):
    scenario: str
    speed: float

class RouteRequest(BaseModel):
    section: int
    row: str
    seat: int
    language: str
    accessibility: bool
    vendor_preference: str

class DispatchRequest(BaseModel):
    volunteer_id: str
    zone: str
    task: str

class IncidentRequest(BaseModel):
    type: str
    severity: str
    zone: str
    message: str

class GateControlRequest(BaseModel):
    gate: str
    status: str

# API Endpoints
@app.get("/api/state")
def get_current_state():
    state = simulation.get_state()
    predictions = crowd_agent.predict_congestion(state)
    briefing = ops_agent.generate_briefing(state, predictions)
    return {
        "state": state,
        "predictions": predictions,
        "briefing": briefing
    }

@app.post("/api/simulation/control")
def control_simulation(req: ControlRequest):
    logger.info(f"Control request received: scenario={req.scenario}, speed={req.speed}")
    success = simulation.set_scenario(req.scenario)
    simulation.set_speed(req.speed)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid scenario name")
    return {"status": "success", "state": simulation.get_state()}

@app.post("/api/route")
def get_fan_route(req: RouteRequest):
    logger.info(f"Fan route request: section={req.section}, lang={req.language}")
    route_details = fan_agent.generate_route(
        seat_section=req.section,
        seat_row=req.row,
        seat_num=req.seat,
        lang=req.language,
        accessibility=req.accessibility,
        vendor_pref=req.vendor_preference
    )
    return route_details

@app.post("/api/volunteer/dispatch")
def dispatch_volunteer(req: DispatchRequest):
    logger.info(f"Dispatching volunteer {req.volunteer_id} to {req.zone}")
    success = simulation.update_volunteer(
        volunteer_id=req.volunteer_id,
        zone=req.zone,
        status="dispatched",
        task=req.task
    )
    if not success:
        raise HTTPException(status_code=400, detail="Volunteer ID not found")
    return {"status": "success", "volunteers": simulation.volunteers}

@app.post("/api/security/incident")
def create_incident(req: IncidentRequest):
    logger.info(f"New incident reported: {req.message} in {req.zone}")
    new_inc = simulation.add_incident(
        incident_type=req.type,
        severity=req.severity,
        zone=req.zone,
        message=req.message
    )
    return {"status": "success", "incident": new_inc}

@app.post("/api/security/incident/resolve/{incident_id}")
def resolve_incident(incident_id: str):
    logger.info(f"Resolving incident: {incident_id}")
    simulation.resolve_incident(incident_id)
    return {"status": "success"}

@app.post("/api/security/gate")
def control_gate(req: GateControlRequest):
    logger.info(f"Gate control command: gate={req.gate}, status={req.status}")
    success = simulation.update_gate_status(req.gate, req.status)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid gate name or status")
    return {"status": "success", "gate_statuses": simulation.gate_statuses}

@app.post("/api/security/evacuate")
def trigger_evacuation(trigger: bool):
    logger.info(f"Security evacuation trigger: {trigger}")
    if trigger:
        simulation.set_scenario("evacuation")
    else:
        simulation.set_scenario("normal")
    return {"status": "success", "state": simulation.get_state()}

# WebSockets Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state immediately
        state = simulation.get_state()
        predictions = crowd_agent.predict_congestion(state)
        briefing = ops_agent.generate_briefing(state, predictions)
        payload = {
            "state": state,
            "predictions": predictions,
            "briefing": briefing
        }
        await websocket.send_text(json.dumps(payload))
        
        while True:
            # Keep connection alive; clients can send client commands if needed, 
            # or just receive the stream
            data = await websocket.receive_text()
            # Echo or process commands if any
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Serve compiled static files
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    logger.warning(f"Frontend dist directory not found at: {frontend_dist}")
