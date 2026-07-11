# backend/test_api.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_state():
    """Verify that retrieval of live state is successful and returns expected keys."""
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert "state" in data
    assert "predictions" in data
    assert "briefing" in data

def test_validation_invalid_section():
    """Verify Pydantic rejects seats section values below 101 or above 350."""
    payload = {
        "section": 50, # Invalid section
        "row": "F",
        "seat": 10,
        "language": "en",
        "accessibility": False,
        "vendor_preference": "none"
    }
    response = client.post("/api/route", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

def test_validation_invalid_language():
    """Verify Pydantic rejects unsupported language strings."""
    payload = {
        "section": 120,
        "row": "G",
        "seat": 10,
        "language": "de", # Invalid language code
        "accessibility": False,
        "vendor_preference": "none"
    }
    response = client.post("/api/route", json=payload)
    assert response.status_code == 422

def test_validation_invalid_scenario():
    """Verify simulation control refuses invalid scenario names."""
    payload = {
        "scenario": "dangerous_hack", # Invalid scenario
        "speed": 1.0
    }
    response = client.post("/api/simulation/control", json=payload)
    assert response.status_code == 422

def test_security_headers():
    """Verify presence of defense-in-depth HTTP security headers."""
    response = client.get("/api/state")
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert "Content-Security-Policy" in response.headers

def test_rate_limiter():
    """Verify that requests exceeding limits are rejected with 429."""
    # Send requests to exceed limit of 60 within a minute
    # Since we are using TestClient on same instance, they will share the memory IP bucket
    for _ in range(60):
        res = client.get("/api/state")
        if res.status_code == 429:
            # Already hit rate limit from other tests or runs, this is valid success
            return
            
    # The next one must be rate limited
    response = client.get("/api/state")
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]

if __name__ == "__main__":
    print("Running API validation tests...")
    test_get_state()
    test_validation_invalid_section()
    test_validation_invalid_language()
    test_validation_invalid_scenario()
    test_security_headers()
    test_rate_limiter()
    print("All API validation tests passed successfully!")
