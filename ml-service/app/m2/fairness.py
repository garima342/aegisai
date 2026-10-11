"""Fairness auditing and demographic parity analysis for Module M2.

Implemented purely using NumPy and Pandas (no heavy fairness dependencies):
- FAIR-001: Demographic Parity Difference & Four-Fifths Rule (< 0.80)
- FAIR-002: Equal Opportunity Difference (True Positive Rate gap)
- FAIR-003: Equalized Odds Gap (max of TPR gap and FPR gap)
- FAIR-004: Subgroup Accuracy Disparity
"""

import uuid
from typing import Any

import pandas as pd

from app.m2.config import (
    ACCURACY_GAP_THRESHOLD,
    DEMOGRAPHIC_PARITY_DIFF_THRESHOLD,
    EQUAL_OPPORTUNITY_DIFF_THRESHOLD,
    EQUALIZED_ODDS_DIFF_THRESHOLD,
    FOUR_FIFTHS_RULE_THRESHOLD,
)
from app.models import Finding, FindingEvidence


def compute_group_fairness_metrics(
    df: pd.DataFrame,
    sensitive_column: str,
    prediction_column: str,
    target_column: str | None = None,
) -> dict[str, Any]:
    """Calculate selection rate, TPR, FPR, and accuracy for each group in sensitive_column."""
    if sensitive_column not in df.columns or prediction_column not in df.columns:
        raise ValueError(
            f"Required columns '{sensitive_column}' or '{prediction_column}' not found in dataframe."
        )

    valid_mask = df[sensitive_column].notna() & df[prediction_column].notna()
    if target_column and target_column in df.columns:
        valid_mask = valid_mask & df[target_column].notna()

    subset = df[valid_mask]
    groups = subset[sensitive_column].unique()

    group_metrics: dict[str, dict[str, Any]] = {}
    selection_rates: dict[str, float] = {}
    tprs: dict[str, float] = {}
    fprs: dict[str, float] = {}
    accuracies: dict[str, float] = {}

    has_ground_truth = target_column is not None and target_column in df.columns

    for group in groups:
        grp_data = subset[subset[sensitive_column] == group]
        n_samples = len(grp_data)
        if n_samples == 0:
            continue

        preds = (grp_data[prediction_column].astype(float) >= 0.5).astype(int)
        pos_preds = int(preds.sum())
        selection_rate = pos_preds / n_samples
        selection_rates[str(group)] = round(float(selection_rate), 4)

        tpr_val: float | None = None
        fpr_val: float | None = None
        acc_val: float | None = None

        if has_ground_truth:
            actuals = (grp_data[target_column].astype(float) >= 0.5).astype(int)
            pos_actuals = int(actuals.sum())
            neg_actuals = n_samples - pos_actuals

            # TPR = TP / (TP + FN)
            if pos_actuals > 0:
                tp = int(((preds == 1) & (actuals == 1)).sum())
                tpr_val = round(float(tp / pos_actuals), 4)
                tprs[str(group)] = tpr_val

            # FPR = FP / (FP + TN)
            if neg_actuals > 0:
                fp = int(((preds == 1) & (actuals == 0)).sum())
                fpr_val = round(float(fp / neg_actuals), 4)
                fprs[str(group)] = fpr_val

            # Accuracy
            acc = float((preds == actuals).mean())
            acc_val = round(acc, 4)
            accuracies[str(group)] = acc_val

        group_metrics[str(group)] = {
            "sample_count": n_samples,
            "positive_predictions": pos_preds,
            "selection_rate": round(float(selection_rate), 4),
            "true_positive_rate": tpr_val,
            "false_positive_rate": fpr_val,
            "accuracy": acc_val,
        }

    # Aggregate Disparity Metrics
    dp_ratio = 1.0
    dp_diff = 0.0
    min_sr_group = None
    max_sr_group = None

    if selection_rates:
        min_sr_group = min(selection_rates, key=selection_rates.get)  # type: ignore[arg-type]
        max_sr_group = max(selection_rates, key=selection_rates.get)  # type: ignore[arg-type]
        min_sr = selection_rates[min_sr_group]
        max_sr = selection_rates[max_sr_group]
        dp_diff = round(max_sr - min_sr, 4)
        dp_ratio = round(min_sr / max_sr, 4) if max_sr > 0 else 1.0

    eo_diff: float | None = None
    if len(tprs) >= 2:
        eo_diff = round(max(tprs.values()) - min(tprs.values()), 4)

    eq_odds_gap: float | None = None
    if len(tprs) >= 2 and len(fprs) >= 2:
        fpr_diff = max(fprs.values()) - min(fprs.values())
        eq_odds_gap = round(max(eo_diff or 0.0, fpr_diff), 4)

    acc_gap: float | None = None
    if len(accuracies) >= 2:
        acc_gap = round(max(accuracies.values()) - min(accuracies.values()), 4)

    return {
        "sensitive_column": sensitive_column,
        "group_metrics": group_metrics,
        "demographic_parity": {
            "ratio": dp_ratio,
            "difference": dp_diff,
            "min_group": min_sr_group,
            "max_group": max_sr_group,
        },
        "equal_opportunity_difference": eo_diff,
        "equalized_odds_gap": eq_odds_gap,
        "accuracy_gap": acc_gap,
    }


def evaluate_fairness(
    df: pd.DataFrame,
    sensitive_columns: list[str],
    prediction_column: str,
    target_column: str | None = None,
    assessment_id: str = "temp",
) -> tuple[dict[str, Any], list[Finding]]:
    """Evaluate fairness across all specified sensitive attributes and generate findings."""
    all_metrics: dict[str, Any] = {}
    findings: list[Finding] = []

    for sens_col in sensitive_columns:
        if sens_col not in df.columns:
            continue

        metrics = compute_group_fairness_metrics(
            df=df,
            sensitive_column=sens_col,
            prediction_column=prediction_column,
            target_column=target_column,
        )
        all_metrics[sens_col] = metrics

        dp = metrics["demographic_parity"]
        dp_ratio = dp["ratio"]
        dp_diff = dp["difference"]
        min_grp = dp["min_group"]
        max_grp = dp["max_group"]

        # FAIR-001: Four-Fifths Rule and Demographic Parity Disparity
        if dp_ratio < FOUR_FIFTHS_RULE_THRESHOLD or dp_diff > DEMOGRAPHIC_PARITY_DIFF_THRESHOLD:
            if dp_ratio < 0.50:
                severity = "critical"
            elif dp_ratio < FOUR_FIFTHS_RULE_THRESHOLD:
                severity = "high"
            else:
                severity = "medium"

            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="fairness",
                    checkId="FAIR-001",
                    title=f"Demographic parity disparity on '{sens_col}' (Ratio: {dp_ratio:.2f})",
                    description=(
                        f"Selection rate disparity between '{min_grp}' and '{max_grp}' on '{sens_col}'. "
                        f"Demographic parity ratio is {dp_ratio:.2f} (under EEOC 80% four-fifths rule threshold). "
                        f"Difference is {round(dp_diff * 100, 1)}%."
                    ),
                    severity=severity,
                    evidence=FindingEvidence(
                        metric="demographic_parity_ratio",
                        value=dp_ratio,
                        details={
                            "sensitive_column": sens_col,
                            "demographic_parity_ratio": dp_ratio,
                            "demographic_parity_difference": dp_diff,
                            "min_group": min_grp,
                            "max_group": max_grp,
                            "group_breakdown": metrics["group_metrics"],
                        },
                    ),
                    recommendation=(
                        f"The demographic parity ratio ({dp_ratio:.2f}) indicates potential disparate impact. "
                        f"Evaluate decision thresholds per group, balance training data representation, or apply "
                        "fairness-constrained post-processing (e.g. threshold calibration)."
                    ),
                    status="open",
                )
            )

        # FAIR-002: Equal Opportunity Difference (TPR Gap)
        eo_diff = metrics.get("equal_opportunity_difference")
        if eo_diff is not None and eo_diff > EQUAL_OPPORTUNITY_DIFF_THRESHOLD:
            eo_severity = "high" if eo_diff > 0.20 else "medium"
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="fairness",
                    checkId="FAIR-002",
                    title=f"Equal opportunity gap on '{sens_col}' (TPR Gap: {round(eo_diff * 100, 1)}%)",
                    description=(
                        f"True Positive Rate varies by {round(eo_diff * 100, 1)}% across subgroups of '{sens_col}'. "
                        "Qualified members of disadvantaged groups face lower odds of positive outcomes."
                    ),
                    severity=eo_severity,
                    evidence=FindingEvidence(
                        metric="equal_opportunity_difference",
                        value=eo_diff,
                        details={
                            "sensitive_column": sens_col,
                            "equal_opportunity_difference": eo_diff,
                            "group_breakdown": metrics["group_metrics"],
                        },
                    ),
                    recommendation=(
                        f"Recalibrate model decision boundaries to equalize true positive rates across '{sens_col}' subgroups, "
                        "ensuring qualified candidates receive equal opportunity."
                    ),
                    status="open",
                )
            )

        # FAIR-003: Equalized Odds Gap
        eq_odds = metrics.get("equalized_odds_gap")
        if eq_odds is not None and eq_odds > EQUALIZED_ODDS_DIFF_THRESHOLD:
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="fairness",
                    checkId="FAIR-003",
                    title=f"Equalized odds disparity on '{sens_col}' (Max Gap: {round(eq_odds * 100, 1)}%)",
                    description=(
                        f"Model exhibits an equalized odds disparity of {round(eq_odds * 100, 1)}% on '{sens_col}'. "
                        "Both true positive and false positive error distributions diverge across demographic segments."
                    ),
                    severity="high" if eq_odds > 0.20 else "medium",
                    evidence=FindingEvidence(
                        metric="equalized_odds_gap",
                        value=eq_odds,
                        details={
                            "sensitive_column": sens_col,
                            "equalized_odds_gap": eq_odds,
                            "group_breakdown": metrics["group_metrics"],
                        },
                    ),
                    recommendation=(
                        "Incorporate equalized odds loss regularizers or post-processing threshold adjustments "
                        "to balance error rates across groups."
                    ),
                    status="open",
                )
            )

        # FAIR-004: Accuracy Gap
        acc_gap = metrics.get("accuracy_gap")
        if acc_gap is not None and acc_gap > ACCURACY_GAP_THRESHOLD:
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M2",
                    domain="fairness",
                    checkId="FAIR-004",
                    title=f"Subgroup accuracy divergence on '{sens_col}' (Gap: {round(acc_gap * 100, 1)}%)",
                    description=(
                        f"Model accuracy differs by {round(acc_gap * 100, 1)}% between subgroups of '{sens_col}'. "
                        "The model delivers unequal reliability depending on demographic subgroup."
                    ),
                    severity="medium",
                    evidence=FindingEvidence(
                        metric="subgroup_accuracy_gap",
                        value=acc_gap,
                        details={
                            "sensitive_column": sens_col,
                            "accuracy_gap": acc_gap,
                            "group_breakdown": metrics["group_metrics"],
                        },
                    ),
                    recommendation=(
                        f"Collect more balanced training data for lower-performing subgroups in '{sens_col}' "
                        "or explore subgroup-specific feature representations."
                    ),
                    status="open",
                )
            )

    return all_metrics, findings
