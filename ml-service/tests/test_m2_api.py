"""End-to-end integration tests for Module M2 API endpoints."""

import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

HR_DATA_PATH = Path(__file__).parent.parent.parent / "sample_data" / "hr_recruitment.csv"
HR_MODEL_PATH = Path(__file__).parent.parent.parent / "sample_data" / "hr_model.joblib"


def test_data_quality_endpoint_with_csv_upload():
    csv_data = "col1,col2,col3\n1,a,10\n2,b,\n3,c,\n4,d,\n"
    response = client.post(
        "/m2/data-quality",
        files={"file": ("test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
        data={"assessment_id": "test-asm-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assessmentId"] == "test-asm-1"
    assert "findings" in data
    assert "domainRisk" in data
    assert "summary" in data
    assert data["summary"]["totalRows"] == 4


def test_data_quality_endpoint_with_json_payload():
    csv_data = "gender,age,hired\nMale,25,1\nFemale,30,0\nMale,35,1\nFemale,28,0\n"
    response = client.post(
        "/m2/data-quality",
        json={
            "assessment_id": "json-test",
            "csv_content": csv_data,
            "target_column": "hired",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assessmentId"] == "json-test"
    assert "gender" in data["detectedSensitiveAttributes"]
    assert "age" in data["detectedSensitiveAttributes"]


def test_hr_recruitment_meets_acceptance_criteria():
    """Acceptance criteria:

    Running on hr_recruitment.csv produces a fairness finding for gender
    (demographic parity ratio < 0.8) and at least 2 data-quality findings.
    """
    assert HR_DATA_PATH.is_file(), f"Sample dataset missing at {HR_DATA_PATH}"

    # 1. Run Data Quality
    with open(HR_DATA_PATH, "rb") as f:
        dq_res = client.post(
            "/m2/data-quality",
            files={"file": ("hr_recruitment.csv", f, "text/csv")},
            data={"target_column": "hired"},
        )
    assert dq_res.status_code == 200
    dq_data = dq_res.json()
    dq_findings = [f for f in dq_data["findings"] if f["domain"] == "data_quality"]

    # Must produce at least 2 data-quality findings
    assert len(dq_findings) >= 2, f"Expected >= 2 data quality findings, got {len(dq_findings)}"

    # Check IDs present
    dq_check_ids = [f["checkId"] for f in dq_findings]
    assert "DQ-001" in dq_check_ids or "DQ-004" in dq_check_ids or "DQ-007" in dq_check_ids

    # 2. Run Fairness on hr_recruitment
    fair_res = client.post(
        "/m2/fairness",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "prediction_column": "hired",
            "sensitive_attributes": ["gender"],
        },
    )
    assert fair_res.status_code == 200
    fair_data = fair_res.json()
    fair_findings = fair_data["findings"]

    # Must produce fairness finding for gender (demographic parity ratio < 0.8)
    gender_fair_findings = [
        f for f in fair_findings if f["checkId"] == "FAIR-001" and "gender" in f["title"]
    ]
    assert len(gender_fair_findings) == 1, "Missing demographic parity finding for gender"
    ratio = gender_fair_findings[0]["evidence"]["value"]
    assert ratio < 0.80, f"Expected demographic parity ratio < 0.80, got {ratio}"


def test_api_validation_and_4xx_errors():
    # 1. Empty dataset
    empty_csv = "col1,col2\n"
    res1 = client.post(
        "/m2/data-quality",
        files={"file": ("empty.csv", io.BytesIO(empty_csv.encode("utf-8")), "text/csv")},
    )
    assert res1.status_code == 400
    assert "zero rows" in res1.json()["detail"].lower()

    # 2. Non-existent target column
    valid_csv = "col1,col2\n1,2\n3,4\n"
    res2 = client.post(
        "/m2/data-quality",
        files={"file": ("valid.csv", io.BytesIO(valid_csv.encode("utf-8")), "text/csv")},
        data={"target_column": "non_existent_column"},
    )
    assert res2.status_code == 400
    assert "does not exist" in res2.json()["detail"].lower()

    # 3. Non-existent file path
    res3 = client.post(
        "/m2/data-quality",
        json={"dataset_path": "/path/to/missing/dataset.csv"},
    )
    assert res3.status_code == 404

    # 4. Unsupported content type
    res4 = client.post(
        "/m2/data-quality",
        content="some raw non-csv string",
        headers={"Content-Type": "text/html"},
    )
    assert res4.status_code == 415

    # 5. Missing prediction_column on fairness endpoint
    res5 = client.post(
        "/m2/fairness",
        json={"dataset_path": str(HR_DATA_PATH)},
    )
    assert res5.status_code == 400
    assert "prediction_column" in res5.json()["detail"]


def test_model_performance_endpoint_security_and_evaluation(monkeypatch):
    # Security: default is disabled -> 403 Forbidden
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "false")
    res_forbidden = client.post(
        "/m2/model-performance",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "model_path": str(HR_MODEL_PATH),
            "target_column": "hired",
        },
    )
    assert res_forbidden.status_code == 403
    assert "disabled by default for security" in res_forbidden.json()["detail"]

    # Security: enabled -> 200 OK
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")
    res_ok = client.post(
        "/m2/model-performance",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "model_path": str(HR_MODEL_PATH),
            "target_column": "hired",
        },
    )
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert "domainRisk" in data


def test_full_analyze_pipeline(monkeypatch):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")
    res = client.post(
        "/m2/analyze",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "model_path": str(HR_MODEL_PATH),
            "target_column": "hired",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "findings" in data
    assert "dataQualityRisk" in data
    assert "fairnessRisk" in data
    assert "modelRisk" in data
    assert "overallRisk" in data
    assert len(data["findings"]) >= 3


def test_api_text_csv_and_form_variants():
    # 1. Raw text/csv
    raw_csv = "a,b,c\n1,2,3\n4,5,6\n7,8,9\n"
    res1 = client.post(
        "/m2/data-quality",
        content=raw_csv.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert res1.status_code == 200

    # 2. Multipart with dataset_path
    res2 = client.post(
        "/m2/data-quality",
        data={"dataset_path": str(HR_DATA_PATH), "sensitive_attributes": "gender, age"},
    )
    assert res2.status_code == 200
    assert "gender" in res2.json()["detectedSensitiveAttributes"]

    # 3. Multipart with csv_content
    res3 = client.post(
        "/m2/data-quality",
        data={"csv_content": "col1,col2\n10,20\n30,40\n", "sensitive_attributes": '["gender"]'},
    )
    assert res3.status_code == 200

    # 4. Fairness with auto-detection of sensitive columns
    res4 = client.post(
        "/m2/fairness",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "prediction_column": "hired",
        },
    )
    assert res4.status_code == 200
    assert "gender" in res4.json()["auditedAttributes"]


def test_model_performance_multipart_file_upload(monkeypatch):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    with open(HR_DATA_PATH, "rb") as f_data, open(HR_MODEL_PATH, "rb") as f_model:
        res = client.post(
            "/m2/model-performance",
            files={
                "file": ("hr.csv", f_data, "text/csv"),
                "model_file": ("hr_model.joblib", f_model, "application/octet-stream"),
            },
            data={"target_column": "hired", "drop_columns": "candidate_id, referral_source"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data["metrics"]


def test_model_performance_multipart_with_model_path(monkeypatch):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    res = client.post(
        "/m2/model-performance",
        data={
            "dataset_path": str(HR_DATA_PATH),
            "model_path": str(HR_MODEL_PATH),
            "target_column": "hired",
        },
    )
    assert res.status_code == 200


def test_analyze_with_prediction_column():
    res = client.post(
        "/m2/analyze",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "target_column": "hired",
            "prediction_column": "hired",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["fairnessRisk"] > 0.0


def test_api_additional_error_cases():
    # 1. Model performance missing target_column in multipart
    res1 = client.post("/m2/model-performance", data={"dataset_path": str(HR_DATA_PATH)})
    assert res1.status_code == 400

    # 2. Model performance missing target_column in json
    res2 = client.post("/m2/model-performance", json={"dataset_path": str(HR_DATA_PATH)})
    assert res2.status_code == 400

    # 3. Model performance missing model_path in json
    res3 = client.post(
        "/m2/model-performance",
        json={"dataset_path": str(HR_DATA_PATH), "target_column": "hired"},
    )
    assert res3.status_code == 400

    # 4. Fairness with non-existent prediction_column
    res4 = client.post(
        "/m2/fairness",
        json={"dataset_path": str(HR_DATA_PATH), "prediction_column": "nonexistent"},
    )
    assert res4.status_code == 400

    # 5. Fairness with non-existent target_column
    res5 = client.post(
        "/m2/fairness",
        json={
            "dataset_path": str(HR_DATA_PATH),
            "prediction_column": "hired",
            "target_column": "fake_target",
        },
    )
    assert res5.status_code == 400

    # 6. Fairness with no sensitive attributes in dataset
    df_no_sens = "colA,colB,pred\n1,2,1\n3,4,0\n5,6,1\n"
    res6 = client.post(
        "/m2/fairness",
        json={"csv_content": df_no_sens, "prediction_column": "pred"},
    )
    assert res6.status_code == 400
    assert "no sensitive attributes" in res6.json()["detail"].lower()

    # 7. Malformed CSV string
    res7 = client.post(
        "/m2/data-quality",
        json={"csv_content": "col1,col2\n1,2,3,4\n5"},
    )
    # pandas error or processing
    assert res7.status_code in (200, 400)

    # 8. Model performance with unsupported model extension upload
    monkeypatch_env = pytest.MonkeyPatch()
    monkeypatch_env.setenv("ALLOW_MODEL_LOAD", "true")
    res8 = client.post(
        "/m2/model-performance",
        files={
            "file": ("test.csv", io.BytesIO(b"a,b\n1,2\n"), "text/csv"),
            "model_file": ("bad_model.exe", io.BytesIO(b"fake-exe"), "application/octet-stream"),
        },
        data={"target_column": "b"},
    )
    assert res8.status_code == 400
    assert "unsupported model extension" in res8.json()["detail"].lower()
