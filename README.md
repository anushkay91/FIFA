# CrowdMind AI - Stadium Crowd Management System

## Overview

CrowdMind AI is an intelligent stadium simulation and operations management platform. Designed to handle massive event crowds (like FIFA matches), the system provides real-time tracking, predictive congestion analysis, intelligent routing for fans, and automated volunteer dispatching to ensure smooth stadium operations and enhanced safety.

## Problem Solved

Managing large crowds in stadiums during major sporting events presents significant logistical and safety challenges. Operations teams often struggle with:
- Unpredictable bottlenecks and gate congestion.
- Inefficient allocation of stadium volunteers.
- Delayed responses to security, medical, and technical incidents.
- Suboptimal routing for fans seeking seats, restrooms, or vendors.

**CrowdMind AI solves these problems by:**
1. **Predictive Analytics**: Forecasting crowd congestion before it happens using AI agents.
2. **Automated Dispatch**: Intelligently assigning volunteers to high-priority zones based on real-time incident reports and crowd flow.
3. **Personalized Routing**: Generating dynamic, accessible, and multi-lingual routes for fans.
4. **Real-time Operations Briefing**: Providing a live copilot dashboard for stadium operators to act quickly on AI-generated insights.

## Project Architecture & Workflow

The project is structured into a modern full-stack architecture featuring a decoupled frontend and backend.

### Backend (`/backend`)
- **Framework**: Python FastAPI
- **Real-Time Communication**: WebSockets broadcast live simulation states, AI predictions, and operational briefings to all connected clients at 1Hz.
- **RESTful APIs**: Handles discrete commands such as incident reporting, fan routing requests, volunteer dispatch, and gate controls.
- **AI Agents**:
  - `CrowdIntelligenceAgent`: Analyzes simulation state to predict zone congestion.
  - `OperationsCopilotAgent`: Synthesizes data into actionable briefings for operations managers.
  - `VolunteerAgent`: Auto-dispatches stadium volunteers to active incident zones.
  - `FanAgent`: Calculates optimized paths for fans based on accessibility, vendor preferences, and language.
- **Simulation Engine**: A physics-based stadium simulation that tracks crowd movement, weather impacts, gate failures, and evacuation scenarios.

### Frontend (`/frontend`)
- **Framework**: React + TypeScript + Vite
- **Functionality**: Consumes the WebSocket stream to visualize the stadium state in real-time. Allows operators to trigger incidents, adjust simulation speeds, and manage gates.

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js & npm

### Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## API Documentation

Once the backend is running, you can access the interactive API documentation (Swagger UI) at:
`http://localhost:8000/docs`