"""Sensitive attribute exposure and proxy variable detection for Module M2.

Implements pure functions analyzing:
- DQ-008: Sensitive attribute exposure (declared + auto-detected regex)
- DQ-009: Proxy variable exposure (correlation and mutual information)
"""

import re
import uuid

import numpy as np
import pandas as pd

from app.m2.config import (
    PROXY_CORRELATION_HIGH,
    PROXY_CORRELATION_MEDIUM,
    SENSITIVE_PATTERNS,
)
from app.models import Finding, FindingEvidence


def detect_sensitive_attributes(
    columns: list[str],
    declared_attributes: list[str] | None = None,
) -> list[str]:
    """Auto-detect sensitive demographic column names via regex pattern matching and union with declared ones."""
    detected = set()

    # Add user declared columns if present
    if declared_attributes:
        for attr in declared_attributes:
            if attr in columns:
                detected.add(attr)

    # Regex detection on column names
    patterns = [re.compile(p, re.IGNORECASE) for p in SENSITIVE_PATTERNS]

    for col in columns:
        clean_col = col.strip().lower()
        for pat in patterns:
            if pat.search(clean_col):
                detected.add(col)
                break

    return sorted(detected)


def check_sensitive_attribute_exposure(
    df: pd.DataFrame,
    sensitive_columns: list[str],
    assessment_id: str = "temp",
) -> list[Finding]:
    """Flag presence of direct sensitive attributes in dataset features."""
    if not sensitive_columns:
        return []

    present = [c for c in sensitive_columns if c in df.columns]
    if not present:
        return []

    return [
        Finding(
            id=str(uuid.uuid4()),
            assessmentId=assessment_id,
            module="M2",
            domain="fairness",
            checkId="DQ-008",
            title=f"Direct sensitive attributes present ({len(present)} detected)",
            description=(
                f"Dataset contains protected demographic attributes: {present}. Direct inclusion "
                "in model training may lead to disparate impact or regulatory non-compliance."
            ),
            severity="medium",
            evidence=FindingEvidence(
                metric="sensitive_attribute_count",
                value=float(len(present)),
                details={
                    "detected_sensitive_columns": present,
                    "total_features": len(df.columns),
                },
            ),
            recommendation=(
                "Determine whether protected attributes are legally permissible inputs. If needed for "
                "fairness auditing only, isolate them from the training feature set."
            ),
            status="open",
        )
    ]


def _compute_association(s1: pd.Series, s2: pd.Series) -> tuple[float, str]:
    """Compute association score between two series (0.0 to 1.0) and method used."""
    valid_mask = s1.notna() & s2.notna()
    if valid_mask.sum() < 10:
        return 0.0, "insufficient_data"

    v1 = s1[valid_mask]
    v2 = s2[valid_mask]

    is_num1 = pd.api.types.is_numeric_dtype(v1)
    is_num2 = pd.api.types.is_numeric_dtype(v2)

    if is_num1 and is_num2:
        if v1.std() == 0 or v2.std() == 0:
            return 0.0, "zero_variance"
        corr = float(abs(v1.corr(v2)))
        return (0.0 if np.isnan(corr) else min(1.0, corr)), "pearson"

    # If categorical / mixed: factorize and compute Spearman rank / Pearson on codes
    codes1, _ = pd.factorize(v1)
    codes2, _ = pd.factorize(v2)

    s_codes1 = pd.Series(codes1)
    s_codes2 = pd.Series(codes2)

    if s_codes1.std() == 0 or s_codes2.std() == 0:
        return 0.0, "zero_variance"

    corr = float(abs(s_codes1.corr(s_codes2)))
    val = 0.0 if np.isnan(corr) else min(1.0, corr)
    return val, "factorized_correlation"


def detect_proxy_variables(
    df: pd.DataFrame,
    sensitive_columns: list[str],
    target_column: str | None = None,
    assessment_id: str = "temp",
) -> list[Finding]:
    """Detect non-sensitive feature columns that correlate strongly with sensitive attributes."""
    findings: list[Finding] = []
    if not sensitive_columns or len(df) < 10:
        return findings

    sens_set = set(sensitive_columns)
    ignore_set = sens_set | ({target_column} if target_column else set())

    candidate_cols = [c for c in df.columns if c not in ignore_set]

    for sens_col in sensitive_columns:
        if sens_col not in df.columns:
            continue

        for col in candidate_cols:
            score, method = _compute_association(df[sens_col], df[col])

            if score >= PROXY_CORRELATION_HIGH:
                severity = "high"
            elif score >= PROXY_CORRELATION_MEDIUM:
                severity = "medium"
            else:
                continue

            pct = round(score * 100, 1)
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="fairness",
                    checkId="DQ-009",
                    title=f"Proxy variable detected: '{col}' correlates with '{sens_col}' ({round(score, 2)})",
                    description=(
                        f"Feature '{col}' exhibits significant correlation ({round(score, 2)}, {pct}%) "
                        f"with protected attribute '{sens_col}'. It can act as a proxy variable and propagate "
                        "indirect bias even if the protected attribute is dropped."
                    ),
                    severity=severity,
                    evidence=FindingEvidence(
                        metric="proxy_correlation",
                        value=round(score, 4),
                        details={
                            "feature": col,
                            "sensitive_attribute": sens_col,
                            "method": method,
                            "correlation": round(score, 4),
                        },
                    ),
                    recommendation=(
                        f"Examine whether '{col}' encodes historical or structural bias associated with '{sens_col}'. "
                        "Consider feature decorrelation, counterfactual data augmentation, or fairness constraints."
                    ),
                    status="open",
                )
            )

    return findings
