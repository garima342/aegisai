"""Unit tests for M2 Fairness metrics and checks (FAIR-001 to FAIR-004)."""

import pandas as pd

from app.m2.fairness import evaluate_fairness


def test_fairness_perfect_equality():
    df = pd.DataFrame({
        "gender": ["Male"] * 50 + ["Female"] * 50,
        "pred": [1, 0] * 50,  # 50% selection rate in both groups
        "actual": [1, 0] * 50,
    })
    metrics, findings = evaluate_fairness(
        df=df,
        sensitive_columns=["gender"],
        prediction_column="pred",
        target_column="actual",
        assessment_id="test-asm",
    )
    assert findings == []
    dp = metrics["gender"]["demographic_parity"]
    assert dp["ratio"] == 1.0
    assert dp["difference"] == 0.0


def test_four_fifths_rule_violation():
    # Male: 40/50 = 80% selection rate
    # Female: 15/50 = 30% selection rate
    # Ratio: 30 / 80 = 0.375 (< 0.50 -> critical)
    df = pd.DataFrame({
        "gender": ["Male"] * 50 + ["Female"] * 50,
        "pred": [1] * 40 + [0] * 10 + [1] * 15 + [0] * 35,
    })
    _, findings = evaluate_fairness(
        df=df,
        sensitive_columns=["gender"],
        prediction_column="pred",
        assessment_id="test-asm",
    )

    fair_findings = [f for f in findings if f.checkId == "FAIR-001"]
    assert len(fair_findings) == 1
    assert fair_findings[0].severity == "critical"
    assert fair_findings[0].evidence.value == 0.375


def test_equal_opportunity_difference():
    # Male qualified (actual=1): 20 samples, 18 selected (TPR = 0.90)
    # Female qualified (actual=1): 20 samples, 10 selected (TPR = 0.50)
    # TPR Gap = 0.40 (> 0.20 -> high)
    males = pd.DataFrame({
        "gender": ["Male"] * 30,
        "actual": [1] * 20 + [0] * 10,
        "pred": [1] * 18 + [0] * 2 + [0] * 10,
    })
    females = pd.DataFrame({
        "gender": ["Female"] * 30,
        "actual": [1] * 20 + [0] * 10,
        "pred": [1] * 10 + [0] * 10 + [0] * 10,
    })
    df = pd.concat([males, females], ignore_index=True)

    _, findings = evaluate_fairness(
        df=df,
        sensitive_columns=["gender"],
        prediction_column="pred",
        target_column="actual",
        assessment_id="test-asm",
    )

    eo_findings = [f for f in findings if f.checkId == "FAIR-002"]
    assert len(eo_findings) == 1
    assert eo_findings[0].severity == "high"
    assert eo_findings[0].evidence.value == 0.40


def test_equalized_odds_and_accuracy_gap():
    # Diverging error rates and accuracy
    males = pd.DataFrame({
        "gender": ["Male"] * 20,
        "actual": [1] * 10 + [0] * 10,
        "pred": [1] * 10 + [0] * 10,  # 100% accuracy, TPR=1.0, FPR=0.0
    })
    females = pd.DataFrame({
        "gender": ["Female"] * 20,
        "actual": [1] * 10 + [0] * 10,
        "pred": [0] * 10 + [1] * 10,  # 0% accuracy, TPR=0.0, FPR=1.0
    })
    df = pd.concat([males, females], ignore_index=True)

    _, findings = evaluate_fairness(
        df=df,
        sensitive_columns=["gender"],
        prediction_column="pred",
        target_column="actual",
        assessment_id="test-asm",
    )

    # Should trigger FAIR-003 (equalized odds) and FAIR-004 (accuracy gap)
    check_ids = [f.checkId for f in findings]
    assert "FAIR-003" in check_ids
    assert "FAIR-004" in check_ids
