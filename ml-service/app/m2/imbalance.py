"""Class imbalance check for Module M2.

Implements pure function analyzing:
- DQ-007: Target class imbalance ratio and minority class representation.
"""

import uuid

import pandas as pd

from app.m2.config import (
    IMBALANCE_CRITICAL_THRESHOLD,
    IMBALANCE_HIGH_THRESHOLD,
    IMBALANCE_MEDIUM_THRESHOLD,
)
from app.models import Finding, FindingEvidence


def check_class_imbalance(
    df: pd.DataFrame,
    target_column: str,
    assessment_id: str = "temp",
) -> list[Finding]:
    """Analyze target column distribution and flag severity bands for class imbalance.

    Severity bands:
    - Minority class < 2% -> critical
    - Minority class < 10% -> high
    - Minority class < 20% -> medium
    """
    if target_column not in df.columns:
        return []

    series = df[target_column].dropna()
    total_valid = len(series)
    if total_valid == 0:
        return []

    counts = series.value_counts()
    if len(counts) < 2:
        return []

    min_class = counts.index[-1]
    min_count = int(counts.iloc[-1])
    max_count = int(counts.iloc[0])

    minority_ratio = min_count / total_valid
    imbalance_ratio = max_count / min_count if min_count > 0 else float("inf")

    if minority_ratio < IMBALANCE_CRITICAL_THRESHOLD:
        severity = "critical"
    elif minority_ratio < IMBALANCE_HIGH_THRESHOLD:
        severity = "high"
    elif minority_ratio < IMBALANCE_MEDIUM_THRESHOLD:
        severity = "medium"
    else:
        return []

    pct = round(minority_ratio * 100, 2)
    distribution = {str(k): int(v) for k, v in counts.items()}

    return [
        Finding(
            id=str(uuid.uuid4()),
            assessmentId=assessment_id,
            module="M2",
            domain="data_quality",
            checkId="DQ-007",
            title=f"Severe class imbalance on target '{target_column}' ({pct}% minority)",
            description=(
                f"Target column '{target_column}' has minority class '{min_class}' with only "
                f"{min_count} samples ({pct}%). Max-to-min class imbalance ratio is {imbalance_ratio:.2f}:1."
            ),
            severity=severity,
            evidence=FindingEvidence(
                metric="minority_class_ratio",
                value=pct,
                details={
                    "target_column": target_column,
                    "minority_class": str(min_class),
                    "minority_count": min_count,
                    "minority_ratio": round(minority_ratio, 4),
                    "imbalance_ratio": round(imbalance_ratio, 2),
                    "class_distribution": distribution,
                    "total_samples": total_valid,
                },
            ),
            recommendation=(
                f"Target '{target_column}' is imbalanced. Use SMOTE / ADASYN oversampling, class-weighted "
                "loss functions, or threshold adjustment. Evaluate using PR-AUC, F1-macro or balanced accuracy "
                "rather than standard accuracy."
            ),
            status="open",
        )
    ]
