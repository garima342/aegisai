"""Unit tests for M2 Data Quality checks (DQ-001 to DQ-006)."""

import numpy as np
import pandas as pd

from app.m2.data_quality import (
    check_constant_columns,
    check_duplicate_rows,
    check_high_cardinality,
    check_missing_values,
    check_mixed_types,
    check_outliers_iqr,
    run_data_quality_suite,
)


def test_missing_values_triggers_medium_and_high():
    # 100 rows
    n = 100
    df = pd.DataFrame({
        "clean_col": range(n),
        "medium_missing": [None if i < 8 else i for i in range(n)],  # 8% missing -> medium (>5%)
        "high_missing": [None if i < 25 else i for i in range(n)],  # 25% missing -> high (>20%)
        "low_missing": [None if i < 3 else i for i in range(n)],  # 3% missing -> not flagged
    })

    findings = check_missing_values(df, assessment_id="test-asm")
    assert len(findings) == 2

    by_col = {f.evidence.details["column"]: f for f in findings}
    assert "medium_missing" in by_col
    assert by_col["medium_missing"].severity == "medium"
    assert by_col["medium_missing"].checkId == "DQ-001"
    assert by_col["medium_missing"].evidence.value == 8.0

    assert "high_missing" in by_col
    assert by_col["high_missing"].severity == "high"
    assert by_col["high_missing"].checkId == "DQ-001"
    assert by_col["high_missing"].evidence.value == 25.0


def test_missing_values_empty_dataframe():
    df = pd.DataFrame()
    findings = check_missing_values(df)
    assert findings == []


def test_duplicate_rows():
    df_clean = pd.DataFrame({"a": [1, 2, 3, 4], "b": ["x", "y", "z", "w"]})
    assert check_duplicate_rows(df_clean) == []

    # 100 rows with 8 duplicates (8% -> medium)
    df_dup = pd.DataFrame({"a": [1] * 8 + list(range(92)), "b": [1] * 8 + list(range(92))})
    findings = check_duplicate_rows(df_dup, assessment_id="test-asm")
    assert len(findings) == 1
    assert findings[0].checkId == "DQ-002"
    assert findings[0].severity == "medium"

    # Low duplicate ratio (<5%)
    df_low = pd.DataFrame({"a": [1, 1] + list(range(98)), "b": [1, 1] + list(range(98))})
    low_findings = check_duplicate_rows(df_low)
    assert len(low_findings) == 1
    assert low_findings[0].severity == "low"


def test_constant_columns():
    df = pd.DataFrame({
        "varying": [1, 2, 3, 4],
        "constant_num": [42, 42, 42, 42],
        "constant_str": ["single", "single", "single", "single"],
        "mostly_null": [None, None, "value", None],
    })
    findings = check_constant_columns(df, assessment_id="test-asm")
    cols_flagged = [f.evidence.details["column"] for f in findings]
    assert "constant_num" in cols_flagged
    assert "constant_str" in cols_flagged
    assert "mostly_null" in cols_flagged
    assert "varying" not in cols_flagged


def test_outliers_iqr():
    np.random.seed(42)
    # 200 normal samples with some outliers
    normal = np.random.normal(50, 5, 200).tolist()
    # Add 16 extreme outliers (8% -> medium)
    normal[:16] = [200] * 16

    df = pd.DataFrame({"feat": normal})
    findings = check_outliers_iqr(df, assessment_id="test-asm")
    assert len(findings) == 1
    assert findings[0].checkId == "DQ-004"
    assert findings[0].severity == "medium"
    assert findings[0].evidence.value == 8.0


def test_mixed_types():
    df = pd.DataFrame({
        "pure_str": ["apple", "banana", "cherry"] * 20,
        "mixed_col": ["str", 123, "text", 456, "more"] * 12,
    })
    findings = check_mixed_types(df, assessment_id="test-asm")
    assert len(findings) == 1
    assert findings[0].checkId == "DQ-005"
    assert findings[0].severity == "medium"
    assert findings[0].evidence.details["column"] == "mixed_col"


def test_high_cardinality():
    n = 100
    df = pd.DataFrame({
        "id_col": [f"ID_{i}" for i in range(n)],  # 100% unique -> high cardinality
        "cat_col": ["cat_a", "cat_b", "cat_c", "cat_d"] * 25,  # 4 unique -> fine
    })
    findings = check_high_cardinality(df, assessment_id="test-asm")
    assert len(findings) == 1
    assert findings[0].checkId == "DQ-006"
    assert findings[0].evidence.details["column"] == "id_col"


def test_run_data_quality_suite():
    df = pd.DataFrame({
        "col1": [1, 2, 3, 4, 5] * 20,
        "col2": [None if i < 10 else i for i in range(100)],
    })
    findings = run_data_quality_suite(df, assessment_id="suite-test")
    assert len(findings) >= 1
    assert any(f.checkId == "DQ-001" for f in findings)
