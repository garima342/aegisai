"""Unit tests for class imbalance check (DQ-007)."""

import pandas as pd

from app.m2.imbalance import check_class_imbalance


def test_balanced_dataset_produces_no_finding():
    df = pd.DataFrame({"target": [0] * 50 + [1] * 50})
    findings = check_class_imbalance(df, "target", assessment_id="test-asm")
    assert findings == []


def test_imbalance_severity_bands():
    # 1. Medium severity: minority 15% (<20%)
    df_med = pd.DataFrame({"label": [0] * 85 + [1] * 15})
    findings_med = check_class_imbalance(df_med, "label", assessment_id="test-asm")
    assert len(findings_med) == 1
    assert findings_med[0].severity == "medium"
    assert findings_med[0].checkId == "DQ-007"
    assert findings_med[0].evidence.value == 15.0

    # 2. High severity: minority 6% (<10%)
    df_high = pd.DataFrame({"label": [0] * 94 + [1] * 6})
    findings_high = check_class_imbalance(df_high, "label", assessment_id="test-asm")
    assert len(findings_high) == 1
    assert findings_high[0].severity == "high"

    # 3. Critical severity: minority 1.5% (<2%)
    df_crit = pd.DataFrame({"label": [0] * 985 + [1] * 15})  # 15/1000 = 1.5%
    findings_crit = check_class_imbalance(df_crit, "label", assessment_id="test-asm")
    assert len(findings_crit) == 1
    assert findings_crit[0].severity == "critical"


def test_imbalance_invalid_inputs():
    # Target column not present
    df = pd.DataFrame({"other": [1, 2, 3]})
    assert check_class_imbalance(df, "nonexistent") == []

    # Single class only
    df_single = pd.DataFrame({"target": [1, 1, 1, 1]})
    assert check_class_imbalance(df_single, "target") == []

    # Empty target series
    df_empty = pd.DataFrame({"target": [None, None]})
    assert check_class_imbalance(df_empty, "target") == []
