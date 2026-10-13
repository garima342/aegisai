"""API integration tests for Module M3 Explainability FastAPI endpoints."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HR_DATA_PATH = REPO_ROOT / "sample_data" / "hr_recruitment.csv"
HR_MODEL_PATH = REPO_ROOT / "sample_data" / "hr_model.joblib"


@pytest.fixture(autouse=True)
def enable_model_loading(monkeypatch):
    """Enable ALLOW_MODEL_LOAD for API tests."""
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")


def test_api_explainability_global_endpoint():
    """Verify POST /m3/explainability/global returns 200 and chart-ready payload."""
    payload = {
        "assessment_id": "api-exp-global-01",
        "dataset_path": str(HR_DATA_PATH),
        "model_path": str(HR_MODEL_PATH),
        "target_column": "hired",
        "sensitive_attributes": ["gender"],
        "top_n": 5,
        "sample_size": 150,
    }
    response = client.post("/m3/explainability/global", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["assessmentId"] == "api-exp-global-01"
    assert "featureImportances" in data
    assert len(data["featureImportances"]) > 0
    assert "domainRisk" in data
    assert "findings" in data

    # Verify chart-ready format
    first = data["featureImportances"][0]
    assert "feature" in first
    assert "importance" in first
    assert "rank" in first
    assert "percentage" in first


def test_api_explainability_local_endpoint():
    """Verify POST /m3/explainability/local returns 200 and chart-ready local explanations."""
    payload = {
        "assessment_id": "api-exp-local-01",
        "dataset_path": str(HR_DATA_PATH),
        "model_path": str(HR_MODEL_PATH),
        "target_column": "hired",
        "row_index": 0,
        "top_n": 5,
    }
    response = client.post("/m3/explainability/local", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["assessmentId"] == "api-exp-local-01"
    assert data["rowIndex"] == 0
    assert "prediction" in data
    assert "baseValue" in data
    assert "contributions" in data
    assert "topPositive" in data
    assert "topNegative" in data

    # Waterfall chart format
    contrib = data["contributions"][0]
    assert "feature" in contrib
    assert "value" in contrib
    assert "contribution" in contrib
    assert "is_positive" in contrib


def test_api_explainability_validation_errors():
    """Verify endpoints return 400 Bad Request on missing files or invalid options."""
    # Missing model path
    res1 = client.post("/m3/explainability/global", json={"dataset_path": str(HR_DATA_PATH)})
    assert res1.status_code == 400
    assert "model_path" in res1.json()["detail"]

    # Nonexistent file path
    res2 = client.post(
        "/m3/explainability/global",
        json={
            "dataset_path": "nonexistent_file.csv",
            "model_path": str(HR_MODEL_PATH),
        },
    )
    assert res2.status_code == 400


def test_api_explainability_model_load_disabled(monkeypatch):
    """Verify endpoint returns 403 Forbidden when ALLOW_MODEL_LOAD is false."""
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "false")
    payload = {
        "dataset_path": str(HR_DATA_PATH),
        "model_path": str(HR_MODEL_PATH),
    }
    response = client.post("/m3/explainability/global", json=payload)
    assert response.status_code == 400 or response.status_code == 403
    assert "ALLOW_MODEL_LOAD" in response.json()["detail"] or "disabled" in response.json()["detail"]
