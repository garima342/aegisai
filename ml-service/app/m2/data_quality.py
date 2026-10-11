"""Data quality checks for Module M2.

Implements pure functions analyzing:
- DQ-001: Missing values per column
- DQ-002: Duplicate rows
- DQ-003: Constant / Zero-variance columns
- DQ-004: Outliers (IQR method)
- DQ-005: Mixed data types
- DQ-006: High-cardinality categorical columns
"""

import uuid
from typing import Any

import numpy as np
import pandas as pd

from app.m2.config import (
    CONSTANT_COLUMN_MAX_UNIQUE,
    DUPLICATE_ROWS_MEDIUM_THRESHOLD,
    HIGH_CARDINALITY_MIN_UNIQUE,
    HIGH_CARDINALITY_RATIO_THRESHOLD,
    MISSING_HIGH_THRESHOLD,
    MISSING_MEDIUM_THRESHOLD,
    MIXED_TYPE_THRESHOLD,
    OUTLIER_HIGH_THRESHOLD,
    OUTLIER_IQR_FACTOR,
    OUTLIER_MEDIUM_THRESHOLD,
)
from app.models import Finding, FindingEvidence


def check_missing_values(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag columns with missing values exceeding thresholds (>5% medium, >20% high)."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows == 0:
        return findings

    for col in df.columns:
        missing_count = int(df[col].isna().sum())
        if missing_count == 0:
            continue

        missing_ratio = missing_count / total_rows
        if missing_ratio >= MISSING_HIGH_THRESHOLD:
            severity = "high"
        elif missing_ratio >= MISSING_MEDIUM_THRESHOLD:
            severity = "medium"
        else:
            continue

        pct = round(missing_ratio * 100, 2)
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M2",
                domain="data_quality",
                checkId="DQ-001",
                title=f"High missing values in '{col}' ({pct}%)",
                description=(
                    f"Column '{col}' has {missing_count} missing values out of {total_rows} rows "
                    f"({pct}%). Exceeds quality threshold."
                ),
                severity=severity,
                evidence=FindingEvidence(
                    metric="missing_percentage",
                    value=pct,
                    details={
                        "column": col,
                        "missing_count": missing_count,
                        "total_rows": total_rows,
                        "missing_ratio": round(missing_ratio, 4),
                    },
                ),
                recommendation=(
                    f"Investigate why '{col}' is missing. Apply median/mode imputation, model-based "
                    "imputation, or drop the column if information content is minimal."
                ),
                status="open",
            )
        )
    return findings


def check_duplicate_rows(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag duplicate rows in the dataset."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows == 0:
        return findings

    duplicate_count = int(df.duplicated().sum())
    if duplicate_count == 0:
        return findings

    duplicate_ratio = duplicate_count / total_rows
    severity = "medium" if duplicate_ratio >= DUPLICATE_ROWS_MEDIUM_THRESHOLD else "low"
    pct = round(duplicate_ratio * 100, 2)

    findings.append(
        Finding(
            id=str(uuid.uuid4()),
            assessmentId=assessment_id,
            module="M2",
            domain="data_quality",
            checkId="DQ-002",
            title=f"Duplicate records detected ({duplicate_count} rows, {pct}%)",
            description=(
                f"Dataset contains {duplicate_count} duplicate rows ({pct}% of total records). "
                "Duplicate records can inflate test scores and cause data leakage."
            ),
            severity=severity,
            evidence=FindingEvidence(
                metric="duplicate_ratio",
                value=pct,
                details={
                    "duplicate_count": duplicate_count,
                    "total_rows": total_rows,
                    "duplicate_ratio": round(duplicate_ratio, 4),
                },
            ),
            recommendation="Deduplicate dataset before model training to prevent train-test contamination.",
            status="open",
        )
    )
    return findings


def check_constant_columns(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag columns with only one unique non-null value (zero variance)."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows == 0:
        return findings

    for col in df.columns:
        non_null_series = df[col].dropna()
        n_unique = int(non_null_series.nunique())
        if n_unique <= CONSTANT_COLUMN_MAX_UNIQUE:
            constant_val: Any = non_null_series.iloc[0] if n_unique == 1 else None
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="data_quality",
                    checkId="DQ-003",
                    title=f"Constant column detected: '{col}'",
                    description=(
                        f"Column '{col}' contains {n_unique} unique non-null value. It provides "
                        "zero discriminatory information to machine learning models."
                    ),
                    severity="medium",
                    evidence=FindingEvidence(
                        metric="constant_unique_count",
                        value=float(n_unique),
                        details={
                            "column": col,
                            "unique_value": str(constant_val),
                            "total_rows": total_rows,
                        },
                    ),
                    recommendation=f"Remove constant column '{col}' from training features to reduce noise.",
                    status="open",
                )
            )
    return findings


def check_outliers_iqr(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag numeric columns containing high proportions of outliers via IQR."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows < 10:
        return findings

    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 10:
            continue

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        if iqr == 0:
            continue

        lower_bound = q1 - OUTLIER_IQR_FACTOR * iqr
        upper_bound = q3 + OUTLIER_IQR_FACTOR * iqr

        outliers_mask = (series < lower_bound) | (series > upper_bound)
        outlier_count = int(outliers_mask.sum())
        if outlier_count == 0:
            continue

        outlier_ratio = outlier_count / len(series)
        if outlier_ratio >= OUTLIER_HIGH_THRESHOLD:
            severity = "high"
        elif outlier_ratio >= OUTLIER_MEDIUM_THRESHOLD:
            severity = "medium"
        else:
            continue

        pct = round(outlier_ratio * 100, 2)
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M2",
                domain="data_quality",
                checkId="DQ-004",
                title=f"Elevated outlier density in '{col}' ({pct}%)",
                description=(
                    f"Column '{col}' has {outlier_count} IQR outliers ({pct}% of non-null values). "
                    f"Bounds: [{lower_bound:.2f}, {upper_bound:.2f}]."
                ),
                severity=severity,
                evidence=FindingEvidence(
                    metric="outlier_percentage",
                    value=pct,
                    details={
                        "column": col,
                        "outlier_count": outlier_count,
                        "lower_bound": round(lower_bound, 4),
                        "upper_bound": round(upper_bound, 4),
                        "total_non_null": len(series),
                    },
                ),
                recommendation=(
                    f"Verify extreme values in '{col}'. Apply capping (winsorization), robust scaling, "
                    "or log transformations if the model is sensitive to outliers."
                ),
                status="open",
            )
        )
    return findings


def check_mixed_types(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag object/string columns containing mixed underlying Python data types."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows == 0:
        return findings

    object_cols = df.select_dtypes(include=["object", "string"]).columns

    for col in object_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        types_set = {type(val).__name__ for val in series}
        if len(types_set) > 1:
            # Check ratio of minority type
            type_counts = series.map(lambda v: type(v).__name__).value_counts()
            minority_count = int(type_counts.iloc[1])
            minority_ratio = minority_count / len(series)

            if minority_ratio >= MIXED_TYPE_THRESHOLD:
                pct = round(minority_ratio * 100, 2)
                findings.append(
                    Finding(
                        id=str(uuid.uuid4()),
                        assessmentId=assessment_id,
                        module="M2",
                        domain="data_quality",
                        checkId="DQ-005",
                        title=f"Mixed data types in '{col}'",
                        description=(
                            f"Column '{col}' contains multiple Python types: {sorted(types_set)}. "
                            f"{pct}% of values diverge from dominant type."
                        ),
                        severity="medium",
                        evidence=FindingEvidence(
                            metric="mixed_type_percentage",
                            value=pct,
                            details={
                                "column": col,
                                "types_found": list(types_set),
                                "counts_by_type": {k: int(v) for k, v in type_counts.items()},
                            },
                        ),
                        recommendation=(
                            f"Enforce strict schema casting on '{col}' (e.g. coerce to string or numeric) "
                            "to avoid silent errors during inference."
                        ),
                        status="open",
                    )
                )
    return findings


def check_high_cardinality(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Flag non-numeric categorical columns with high cardinality (ratio > 50%, unique >= 20)."""
    findings: list[Finding] = []
    total_rows = len(df)
    if total_rows < 20:
        return findings

    categorical_cols = df.select_dtypes(include=["object", "string", "category"]).columns

    for col in categorical_cols:
        series = df[col].dropna()
        n_unique = int(series.nunique())
        if n_unique < HIGH_CARDINALITY_MIN_UNIQUE:
            continue

        ratio = n_unique / total_rows
        if ratio >= HIGH_CARDINALITY_RATIO_THRESHOLD:
            pct = round(ratio * 100, 2)
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="data_quality",
                    checkId="DQ-006",
                    title=f"High cardinality in categorical column '{col}' ({n_unique} unique)",
                    description=(
                        f"Column '{col}' contains {n_unique} distinct categories ({pct}% of total records). "
                        "Can cause curse of dimensionality or overfitting in one-hot/target encoding."
                    ),
                    severity="low",
                    evidence=FindingEvidence(
                        metric="cardinality_ratio",
                        value=pct,
                        details={
                            "column": col,
                            "unique_count": n_unique,
                            "total_rows": total_rows,
                            "cardinality_ratio": round(ratio, 4),
                        },
                    ),
                    recommendation=(
                        f"Group rare categories in '{col}' into an 'Other' bucket, or use frequency/embedding "
                        "encoding instead of broad one-hot encoding."
                    ),
                    status="open",
                )
            )
    return findings


def run_data_quality_suite(df: pd.DataFrame, assessment_id: str = "temp") -> list[Finding]:
    """Run all primary data quality checks (DQ-001 through DQ-006)."""
    findings: list[Finding] = []
    findings.extend(check_missing_values(df, assessment_id))
    findings.extend(check_duplicate_rows(df, assessment_id))
    findings.extend(check_constant_columns(df, assessment_id))
    findings.extend(check_outliers_iqr(df, assessment_id))
    findings.extend(check_mixed_types(df, assessment_id))
    findings.extend(check_high_cardinality(df, assessment_id))
    return findings
