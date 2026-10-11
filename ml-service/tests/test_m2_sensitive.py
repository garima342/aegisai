"""Unit tests for sensitive attribute and proxy detection (DQ-008, DQ-009)."""

import numpy as np
import pandas as pd

from app.m2.sensitive import (
    check_sensitive_attribute_exposure,
    detect_proxy_variables,
    detect_sensitive_attributes,
)


def test_detect_sensitive_attributes_regex():
    cols = [
        "user_id",
        "gender",
        "age",
        "race_ethnicity",
        "religion",
        "caste_category",
        "disability_flag",
        "marital_status",
        "nationality",
        "zipcode",
        "salary",
        "tenure_months",
    ]
    detected = detect_sensitive_attributes(cols)
    assert "gender" in detected
    assert "age" in detected
    assert "race_ethnicity" in detected
    assert "religion" in detected
    assert "caste_category" in detected
    assert "disability_flag" in detected
    assert "marital_status" in detected
    assert "nationality" in detected
    assert "zipcode" in detected
    assert "salary" not in detected
    assert "tenure_months" not in detected


def test_detect_sensitive_attributes_with_declared():
    cols = ["salary", "department", "custom_demographic"]
    detected = detect_sensitive_attributes(cols, declared_attributes=["custom_demographic"])
    assert "custom_demographic" in detected
    assert "salary" not in detected


def test_check_sensitive_attribute_exposure():
    df = pd.DataFrame({"gender": ["M", "F"], "age": [25, 30], "score": [80, 90]})
    findings = check_sensitive_attribute_exposure(df, ["gender", "age"], assessment_id="test-asm")
    assert len(findings) == 1
    assert findings[0].checkId == "DQ-008"
    assert findings[0].evidence.value == 2.0
    assert "gender" in findings[0].evidence.details["detected_sensitive_columns"]


def test_detect_proxy_variables_numeric_correlation():
    np.random.seed(42)
    n = 100
    age = np.linspace(20, 60, n)
    # High proxy: tenure is strongly correlated with age
    tenure_high_proxy = age * 0.5 + np.random.normal(0, 1.0, n)
    # Uncorrelated feature
    random_noise = np.random.normal(0, 10, n)

    df = pd.DataFrame({
        "age": age,
        "tenure": tenure_high_proxy,
        "noise": random_noise,
        "target": [1] * 50 + [0] * 50,
    })

    findings = detect_proxy_variables(
        df=df,
        sensitive_columns=["age"],
        target_column="target",
        assessment_id="test-asm",
    )

    # Should flag tenure as proxy for age
    assert len(findings) >= 1
    tenure_findings = [f for f in findings if f.evidence.details["feature"] == "tenure"]
    assert len(tenure_findings) == 1
    assert tenure_findings[0].checkId == "DQ-009"
    assert tenure_findings[0].severity == "high"  # corr is ~0.98

    # Noise should not be flagged
    noise_findings = [f for f in findings if f.evidence.details["feature"] == "noise"]
    assert len(noise_findings) == 0


def test_detect_proxy_variables_categorical():
    n = 100
    gender = ["Male"] * 50 + ["Female"] * 50
    # Group club perfectly correlated with gender
    club = ["MenClub"] * 50 + ["WomenClub"] * 50

    df = pd.DataFrame({
        "gender": gender,
        "club": club,
        "score": list(range(n)),
    })

    findings = detect_proxy_variables(
        df=df,
        sensitive_columns=["gender"],
        assessment_id="test-asm",
    )
    assert any(f.evidence.details["feature"] == "club" for f in findings)
