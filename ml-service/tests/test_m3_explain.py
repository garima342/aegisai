"""Unit tests for M3 Explainability Engine (SHAP, feature importances, and risk checks)."""

import os
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

from app.m3.explain import (
    audit_model_documentation,
    explain_global,
    explain_local,
    is_sensitive_feature,
)
from app.m3.schemas import GlobalExplanationRequest, LocalExplanationRequest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HR_DATA_PATH = REPO_ROOT / "sample_data" / "hr_recruitment.csv"
HR_MODEL_PATH = REPO_ROOT / "sample_data" / "hr_model.joblib"


@pytest.fixture(autouse=True)
def enable_model_loading(monkeypatch):
    """Ensure ALLOW_MODEL_LOAD is active for tests."""
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")


def test_is_sensitive_feature():
    """Verify sensitive feature detector detects declared and regex patterns."""
    assert is_sensitive_feature("cat__gender_Male")
    assert is_sensitive_feature("gender")
    assert is_sensitive_feature("num__age")
    assert is_sensitive_feature("applicant_race")
    assert is_sensitive_feature("custom_attr", declared_attributes=["custom_attr"])
    assert not is_sensitive_feature("technical_score")
    assert not is_sensitive_feature("years_experience")


def test_audit_model_documentation():
    """Verify audit_model_documentation detects missing sections (EXP-005)."""
    # Empty doc
    f_empty = audit_model_documentation("")
    assert len(f_empty) == 1
    assert f_empty[0].checkId == "EXP-005"
    assert f_empty[0].severity == "low"

    # Incomplete doc
    f_partial = audit_model_documentation("This model is for intended use in screening.")
    assert len(f_partial) == 1
    assert "training data" in f_partial[0].evidence.details["missing_sections"]

    # Full doc
    full_doc = (
        "Model card: Intended use for recruitment. Training data gathered from 2024 records. "
        "Known limitations on rare professions. Ethical considerations evaluated. Out-of-scope uses."
    )
    f_full = audit_model_documentation(full_doc)
    assert len(f_full) == 0


def test_hr_model_global_explanation_sensitive_feature():
    """Verify acceptance criterion: on hr_model.joblib, gender surfaces among top features (EXP-001)."""
    req = GlobalExplanationRequest(
        assessment_id="test-hr-exp",
        dataset_path=str(HR_DATA_PATH),
        model_path=str(HR_MODEL_PATH),
        target_column="hired",
        sensitive_attributes=["gender", "age"],
        model_documentation="Intended use for hiring. Training data: historical. Limitations: tabular only. Ethical considerations applied. Out-of-scope for clinical.",
        top_n=5,
        sample_size=200,
    )
    res = explain_global(req)

    assert res.assessmentId == "test-hr-exp"
    assert len(res.featureImportances) > 0
    assert res.explainerType in ["TreeExplainer", "KernelExplainer"]

    # Top features check: gender should be in top features
    top_feature_names = [f.feature for f in res.featureImportances[:3]]
    gender_present = any("gender" in name.lower() for name in top_feature_names)
    assert gender_present, f"Expected gender in top 3 features, got {top_feature_names}"

    # EXP-001 finding should be generated
    exp_001 = next((f for f in res.findings if f.checkId == "EXP-001"), None)
    assert exp_001 is not None
    assert exp_001.severity == "high"
    assert exp_001.domain == "explainability"
    assert exp_001.module == "M3"


def test_dominant_feature_finding_exp_002(tmp_path):
    """Verify EXP-002 is flagged when one feature accounts for >50% importance."""
    import joblib

    # Create synthetic dataset with one dominant feature
    X = pd.DataFrame({
        "dominant_feature": np.random.uniform(0, 10, 100),
        "noise_1": np.random.uniform(0, 1, 100),
        "noise_2": np.random.uniform(0, 1, 100),
    })
    # Target heavily depends exclusively on dominant_feature
    y = (X["dominant_feature"] > 5).astype(int)
    X["target"] = y

    csv_path = tmp_path / "dominant_test.csv"
    X.to_csv(csv_path, index=False)

    model = RandomForestClassifier(n_estimators=10, max_depth=3, random_state=42)
    model.fit(X[["dominant_feature", "noise_1", "noise_2"]], y)
    model_path = tmp_path / "dominant_model.joblib"
    joblib.dump(model, model_path)

    req = GlobalExplanationRequest(
        assessment_id="test-dominant",
        dataset_path=str(csv_path),
        model_path=str(model_path),
        target_column="target",
        top_n=3,
    )
    res = explain_global(req)

    assert len(res.featureImportances) > 0
    top = res.featureImportances[0]
    assert top.feature == "dominant_feature"
    assert top.percentage > 0.50

    exp_002 = next((f for f in res.findings if f.checkId == "EXP-002"), None)
    assert exp_002 is not None
    assert exp_002.severity == "medium"


def test_linear_model_explanation(tmp_path):
    """Verify LinearExplainer fallback works for linear models."""
    import joblib

    X = pd.DataFrame(np.random.randn(80, 4), columns=["feat_a", "feat_b", "feat_c", "feat_d"])
    y = (X["feat_a"] + X["feat_b"] > 0).astype(int)
    X["target"] = y

    csv_path = tmp_path / "linear_data.csv"
    X.to_csv(csv_path, index=False)

    model = LogisticRegression()
    model.fit(X[["feat_a", "feat_b", "feat_c", "feat_d"]], y)
    model_path = tmp_path / "linear_model.joblib"
    joblib.dump(model, model_path)

    req = GlobalExplanationRequest(
        assessment_id="test-linear",
        dataset_path=str(csv_path),
        model_path=str(model_path),
        target_column="target",
        sample_size=60,
    )
    res = explain_global(req)

    assert res.explainerType in ["LinearExplainer", "KernelExplainer"]
    assert len(res.featureImportances) == 4


def test_local_explanation_hr_model():
    """Verify local prediction explanation returns chart-ready contributions."""
    req = LocalExplanationRequest(
        assessment_id="test-local-hr",
        dataset_path=str(HR_DATA_PATH),
        model_path=str(HR_MODEL_PATH),
        target_column="hired",
        row_index=0,
        top_n=5,
    )
    res = explain_local(req)

    assert res.assessmentId == "test-local-hr"
    assert res.rowIndex == 0
    assert res.prediction in [0, 1]
    assert len(res.contributions) > 0

    # Chart-ready verification: each contribution item must have feature, value, contribution
    first = res.contributions[0]
    assert isinstance(first.feature, str)
    assert isinstance(first.contribution, float)
    assert hasattr(first, "is_positive")
    assert isinstance(res.topPositive, list)
    assert isinstance(res.topNegative, list)


def test_explainability_error_modes():
    """Verify validation and failure modes return clear errors instead of 500 tracebacks."""
    # 1. Missing model path
    with pytest.raises(ValueError, match="model_path"):
        explain_global(GlobalExplanationRequest(csv_content="a,b\n1,2"))

    # 2. Missing dataset
    with pytest.raises(ValueError, match="dataset_path"):
        explain_global(GlobalExplanationRequest(model_path="dummy.joblib"))

    # 3. Model loading disabled by default
    os.environ["ALLOW_MODEL_LOAD"] = "false"
    with pytest.raises(ValueError, match="ALLOW_MODEL_LOAD"):
        explain_global(
            GlobalExplanationRequest(
                csv_content="a,b\n1,2",
                model_path=str(HR_MODEL_PATH),
            )
        )


def test_explainer_failure_finding_exp_003(monkeypatch):
    """Verify EXP-003 finding is returned when all explainers fail."""
    def mock_fail_explainer(*args, **kwargs):
        raise RuntimeError("Mock explainer crash")

    monkeypatch.setattr("app.m3.explain.build_shap_explainer", mock_fail_explainer)

    # Calling explain_global without y will cause permutation fallback to fail and return EXP-003 finding
    req = GlobalExplanationRequest(
        assessment_id="test-exp-003",
        dataset_path=str(HR_DATA_PATH),
        model_path=str(HR_MODEL_PATH),
        target_column=None,  # No target column so permutation importance cannot run
    )
    res = explain_global(req)
    assert res.explainerType == "Failed"
    assert len(res.findings) >= 1
    exp_003 = next((f for f in res.findings if f.checkId == "EXP-003"), None)
    assert exp_003 is not None
    assert exp_003.severity == "critical"
    assert res.domainRisk >= 0.5


def test_instability_finding_exp_004(monkeypatch):
    """Verify EXP-004 finding is triggered when bootstrap stability correlation is low (< 0.7)."""
    monkeypatch.setattr("app.m3.explain.calculate_bootstrap_stability", lambda *args, **kwargs: 0.45)

    req = GlobalExplanationRequest(
        assessment_id="test-exp-004",
        dataset_path=str(HR_DATA_PATH),
        model_path=str(HR_MODEL_PATH),
        target_column="hired",
        sample_size=100,
    )
    res = explain_global(req)
    exp_004 = next((f for f in res.findings if f.checkId == "EXP-004"), None)
    assert exp_004 is not None
    assert exp_004.severity == "medium"
    assert res.stabilityScore == 0.45


def test_explainability_domain_risk_calculation():
    """Verify calculate_explainability_domain_risk normalizes correctly."""
    from app.m3.scoring import calculate_explainability_domain_risk
    from app.models import Finding, FindingEvidence

    f_critical = Finding(
        id="f-c",
        assessmentId="test",
        module="M3",
        domain="explainability",
        checkId="EXP-003",
        title="T",
        description="D",
        severity="critical",
        evidence=FindingEvidence(metric="m", value=1.0, details={}),
        recommendation="R",
        status="open",
    )
    # 10 / 20 = 0.5
    assert calculate_explainability_domain_risk([f_critical], cap=20.0) == 0.5
    # Cap <= 0 edge case
    assert calculate_explainability_domain_risk([f_critical], cap=0.0) == 1.0
    # No findings
    assert calculate_explainability_domain_risk([]) == 0.0
