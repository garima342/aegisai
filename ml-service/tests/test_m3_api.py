"""API integration tests for Module M3 FastAPI endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_security_scan_vulnerable_mock():
    """Verify POST /m3/security-scan returns 200 and expected payload for vulnerable mock."""
    payload = {
        "assessment_id": "api-test-assessment-vuln",
        "target_type": "mock_vulnerable",
        "authorized": True,
        "rate_limit_delay": 0.0,
    }
    response = client.post("/m3/security-scan", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["assessmentId"] == "api-test-assessment-vuln"
    assert len(data["findings"]) >= 5
    assert data["domainRisk"] > 0.0
    assert len(data["testResults"]) >= 19
    assert data["summary"]["targetType"] == "mock_vulnerable"
    assert data["summary"]["failedTests"] >= 5


def test_api_security_scan_hardened_mock():
    """Verify POST /m3/security-scan returns 200 and passes most tests for hardened mock."""
    payload = {
        "assessment_id": "api-test-assessment-hardened",
        "target_type": "mock_hardened",
        "authorized": True,
        "rate_limit_delay": 0.0,
    }
    response = client.post("/m3/security-scan", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["assessmentId"] == "api-test-assessment-hardened"
    assert len(data["findings"]) <= 1
    assert data["summary"]["targetType"] == "mock_hardened"


def test_api_security_scan_unauthorized_consent_rejection():
    """Verify POST /m3/security-scan returns 400 Bad Request if user consent is False."""
    payload = {
        "assessment_id": "api-unauthorized-scan",
        "target_type": "mock_vulnerable",
        "authorized": False,
    }
    response = client.post("/m3/security-scan", json=payload)
    assert response.status_code == 400
    assert "authorization consent" in response.json()["detail"].lower()


def test_api_security_scan_missing_http_config():
    """Verify POST /m3/security-scan returns 400 if target_type is 'http' without endpoint_config."""
    payload = {
        "assessment_id": "api-http-missing-config",
        "target_type": "http",
        "authorized": True,
    }
    response = client.post("/m3/security-scan", json=payload)
    assert response.status_code == 400
    assert "endpoint_config" in response.json()["detail"]


def test_api_list_testcases():
    """Verify GET /m3/testcases returns full library catalog."""
    response = client.get("/m3/testcases")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 19
    assert all("id" in item and "title" in item for item in data)


def test_api_list_testcases_filtered():
    """Verify GET /m3/testcases?category=excessive_agency returns only that category."""
    response = client.get("/m3/testcases?category=excessive_agency")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(item["category"] == "excessive_agency" for item in data)
