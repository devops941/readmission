import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "disclaimer" in data

def test_login_invalid():
    res = client.post("/api/auth/login", json={"email": "nonexistent@hospital.org", "password": "wrong"})
    assert res.status_code == 401

def test_auth_and_protected_flow():
    # Login as admin
    res = client.post("/api/auth/login", json={
        "email": "admin@readmitexplain.local",
        "password": "Admin@2026!Readmit"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access /api/auth/me
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "admin@readmitexplain.local"
    assert res_me.json()["role"] == "Admin"

    # List datasets
    res_ds = client.get("/api/datasets", headers=headers)
    assert res_ds.status_code == 200
    assert isinstance(res_ds.json(), list)
