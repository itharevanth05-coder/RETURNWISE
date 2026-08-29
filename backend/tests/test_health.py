import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_database_health_check_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["connected"] is True
    assert "type" in data["database"]
    assert "tables" in data["database"]
    assert data["database"]["tables"]["customers"] >= 0
    assert data["database"]["tables"]["products"] >= 0
    assert data["database"]["tables"]["return_requests"] >= 0

def test_api_v1_health_check_endpoint():
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["connected"] is True
