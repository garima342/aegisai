"""Unit tests for M2 Pydantic schemas."""

from app.m2.schemas import (
    DataQualityRequest,
    DataQualityResponse,
    FairnessRequest,
    FairnessResponse,
    FullAnalysisResponse,
    ModelPerformanceRequest,
    ModelPerformanceResponse,
)
from app.models import Finding, FindingEvidence


def _sample_finding():
    return Finding(
        id="f-1",
        assessmentId="asm-1",
        module="M2",
        domain="data_quality",
        checkId="DQ-001",
        title="Sample",
        description="Sample finding",
        severity="medium",
        evidence=FindingEvidence(metric="missing", value=10.0),
        recommendation="Impute missing data",
        status="open",
    )


def test_m2_schemas_instantiation():
    # DataQuality
    dq_req = DataQualityRequest(csv_content="a,b\n1,2", target_column="b")
    assert dq_req.target_column == "b"

    dq_resp = DataQualityResponse(
        assessmentId="asm-1",
        findings=[_sample_finding()],
        domainRisk=0.15,
        summary={"totalRows": 2},
        detectedSensitiveAttributes=["gender"],
    )
    assert dq_resp.domainRisk == 0.15
    assert len(dq_resp.findings) == 1

    # ModelPerformance
    mp_req = ModelPerformanceRequest(target_column="y", model_path="model.joblib")
    assert mp_req.target_column == "y"

    mp_resp = ModelPerformanceResponse(
        assessmentId="asm-1",
        findings=[],
        domainRisk=0.0,
        metrics={"accuracy": 0.95},
    )
    assert mp_resp.metrics["accuracy"] == 0.95

    # Fairness
    f_req = FairnessRequest(prediction_column="pred", sensitive_attributes=["gender"])
    assert f_req.prediction_column == "pred"

    f_resp = FairnessResponse(
        assessmentId="asm-1",
        findings=[],
        domainRisk=0.0,
        metrics={},
    )
    assert f_resp.assessmentId == "asm-1"

    # Full analysis
    full_resp = FullAnalysisResponse(
        assessmentId="asm-1",
        findings=[_sample_finding()],
        dataQualityRisk=0.15,
        fairnessRisk=0.0,
        modelRisk=0.0,
        overallRisk=0.15,
        metrics={},
    )
    assert full_resp.overallRisk == 0.15
