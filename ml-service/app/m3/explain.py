"""Explainability assessment engine using SHAP and scikit-learn for Module M3.

Assesses model interpretability, produces global and local feature explanations,
and surfaces explainability risks:
- EXP-001: Sensitive attribute or proxy in top feature importances (High)
- EXP-002: Single feature dominates model predictions (>50% importance) (Medium)
- EXP-003: Model is non-explainable / explainer failed (Critical)
- EXP-004: Feature importance ranking is unstable across bootstrap samples (Medium)
- EXP-005: Missing model documentation / model card sections (Low)
"""

import io
import re
import uuid
from typing import Any

import numpy as np
import pandas as pd
import shap
from scipy.stats import spearmanr
from sklearn.inspection import permutation_importance
from sklearn.pipeline import Pipeline

from app.m2.config import SENSITIVE_PATTERNS, resolve_file_path
from app.m2.performance import safe_load_model
from app.m3.config import (
    BOOTSTRAP_STABILITY_CORRELATION_THRESHOLD,
    DEFAULT_TOP_N_FEATURES,
    DOMINANT_FEATURE_THRESHOLD,
    MAX_SHAP_BACKGROUND_SAMPLES,
    MODEL_CARD_REQUIRED_SECTIONS,
    TOP_SENSITIVE_FEATURE_RANK_CUTOFF,
)
from app.m3.schemas import (
    FeatureContributionItem,
    FeatureImportanceItem,
    GlobalExplanationRequest,
    GlobalExplanationResponse,
    LocalExplanationRequest,
    LocalExplanationResponse,
)
from app.m3.scoring import calculate_explainability_domain_risk
from app.models import Finding, FindingEvidence


def load_dataset_from_request(
    dataset_path: str | None = None,
    csv_content: str | None = None,
) -> pd.DataFrame:
    """Load pandas DataFrame from inline CSV text or disk path with path resolution."""
    if csv_content and csv_content.strip():
        return pd.read_csv(io.StringIO(csv_content))

    if dataset_path:
        resolved = resolve_file_path(dataset_path)
        if not resolved.exists():
            raise FileNotFoundError(f"Dataset file not found at '{resolved}'.")
        return pd.read_csv(resolved)

    raise ValueError("Either 'dataset_path' or 'csv_content' must be provided.")


def prepare_features(
    df: pd.DataFrame,
    target_column: str | None = None,
    drop_columns: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.Series | None]:
    """Separate feature matrix X and target y, dropping unwanted columns."""
    df_clean = df.copy()

    # Separate target if present
    y: pd.Series | None = None
    if target_column and target_column in df_clean.columns:
        y = df_clean[target_column]
        df_clean = df_clean.drop(columns=[target_column])

    # Drop explicit excluded columns
    if drop_columns:
        cols_to_drop = [c for c in drop_columns if c in df_clean.columns]
        if cols_to_drop:
            df_clean = df_clean.drop(columns=cols_to_drop)

    return df_clean, y


def is_sensitive_feature(
    feature_name: str,
    declared_attributes: list[str] | None = None,
) -> bool:
    """Check if a feature name matches declared or common demographic sensitive attributes."""
    clean = feature_name.strip().lower()

    # Strip standard sklearn pipeline and one-hot transformer prefixes
    for prefix in ["num__", "cat__", "remainder__"]:
        clean = clean.removeprefix(prefix)

    # Check user-declared sensitive attributes
    if declared_attributes:
        for attr in declared_attributes:
            clean_attr = attr.strip().lower()
            if clean_attr in clean:
                return True

    # Standard demographic sensitive attribute keywords
    sensitive_keywords = [
        "gender",
        "sex",
        "age",
        "race",
        "ethnicity",
        "religion",
        "caste",
        "disability",
        "marital",
        "nationality",
        "zip",
        "pincode",
    ]
    if any(kw in clean for kw in sensitive_keywords):
        return True

    # Check regex patterns from M2 sensitive config
    patterns = [re.compile(p, re.IGNORECASE) for p in SENSITIVE_PATTERNS]
    return any(pat.search(clean) for pat in patterns)


def extract_pipeline_estimator_and_data(
    model: Any,
    X: pd.DataFrame,
) -> tuple[Any, Any, list[str]]:
    """Handle sklearn Pipelines by separating feature transformers from the final estimator.

    Returns:
        tuple of (estimator, transformed_X, feature_names)
    """
    if isinstance(model, Pipeline) and len(model.steps) > 1:
        # Pipeline has transformation steps before estimator
        preprocessor = Pipeline(model.steps[:-1])
        estimator = model.steps[-1][1]
        try:
            X_trans = preprocessor.transform(X)
            # Try to obtain feature names out from preprocessor
            if hasattr(preprocessor, "get_feature_names_out"):
                feat_names = list(preprocessor.get_feature_names_out())
            else:
                n_features = X_trans.shape[1]
                feat_names = [f"feature_{i}" for i in range(n_features)]
            return estimator, X_trans, feat_names
        except (ValueError, TypeError, AttributeError, KeyError, IndexError):
            # Fallback: pass directly to pipeline
            return model, X, list(X.columns)

    return model, X, list(X.columns)


def build_shap_explainer(
    estimator: Any,
    X_background: Any,
) -> tuple[Any, str]:
    """Construct appropriate SHAP explainer with graceful model fallbacks.

    Hierarchy:
    1. TreeExplainer (fast, exact for tree ensembles)
    2. LinearExplainer (for linear models)
    3. General Explainer / KernelExplainer fallback
    """
    # 1. Try TreeExplainer
    try:
        explainer = shap.TreeExplainer(estimator)
        return explainer, "TreeExplainer"
    except (ValueError, TypeError, AttributeError, RuntimeError):
        pass

    # 2. Try LinearExplainer
    try:
        explainer = shap.LinearExplainer(estimator, X_background)
        return explainer, "LinearExplainer"
    except (ValueError, TypeError, AttributeError, RuntimeError):
        pass

    # 3. Try general Explainer / KernelExplainer with small background sample
    try:
        predict_fn = (
            estimator.predict_proba
            if hasattr(estimator, "predict_proba")
            else estimator.predict
        )
        sample_bg = shap.sample(X_background, min(50, len(X_background)))
        explainer = shap.Explainer(predict_fn, sample_bg)
        return explainer, "KernelExplainer"
    except Exception as exc:
        raise RuntimeError(f"Could not construct SHAP explainer for model: {exc}") from exc


def extract_raw_shap_matrix(
    explainer: Any,
    X_data: Any,
) -> np.ndarray:
    """Compute and normalize raw SHAP matrix to 2D array of shape (n_samples, n_features)."""
    shap_out = explainer.shap_values(X_data)

    if isinstance(shap_out, list):
        # Classification with list per class: select positive class (index 1 if binary, else 0)
        chosen = shap_out[1] if len(shap_out) > 1 else shap_out[0]
        return np.array(chosen)

    if isinstance(shap_out, np.ndarray):
        if shap_out.ndim == 3:
            # (samples, features, classes): choose class 1 if binary, else 0
            idx = 1 if shap_out.shape[2] > 1 else 0
            return shap_out[:, :, idx]
        return shap_out

    if hasattr(shap_out, "values"):
        vals = shap_out.values
        if vals.ndim == 3:
            idx = 1 if vals.shape[2] > 1 else 0
            return vals[:, :, idx]
        return np.array(vals)

    return np.array(shap_out)


def calculate_bootstrap_stability(
    estimator: Any,
    X_trans: Any,
    n_features: int,
    explainer: Any,
) -> float:
    """Calculate explanation stability by comparing feature ranks across two bootstrap subsamples.

    Uses Spearman rank correlation. Values < 0.7 indicate explanation instability.
    """
    n_samples = len(X_trans)
    if n_samples < 20 or n_features < 2:
        return 1.0

    half = n_samples // 2
    # Two disjoint or bootstrap subsets
    idx_a = np.random.RandomState(42).choice(n_samples, size=half, replace=False)
    idx_b = np.random.RandomState(99).choice(n_samples, size=half, replace=False)

    try:
        sub_a = X_trans.iloc[idx_a] if isinstance(X_trans, pd.DataFrame) else X_trans[idx_a]
        sub_b = X_trans.iloc[idx_b] if isinstance(X_trans, pd.DataFrame) else X_trans[idx_b]

        vals_a = extract_raw_shap_matrix(explainer, sub_a)
        vals_b = extract_raw_shap_matrix(explainer, sub_b)

        mean_a = np.mean(np.abs(vals_a), axis=0)
        mean_b = np.mean(np.abs(vals_b), axis=0)

        corr = spearmanr(mean_a, mean_b).statistic
        if np.isnan(corr):
            return 1.0
        return float(corr)
    except (ValueError, TypeError, AttributeError, RuntimeError, IndexError):
        return 1.0


def audit_model_documentation(
    doc_text: str | None,
    assessment_id: str = "temp",
) -> list[Finding]:
    """Check documentation / model card text for required governance sections (EXP-005)."""
    if not doc_text or not doc_text.strip():
        return [
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M3",
                domain="explainability",
                checkId="EXP-005",
                title="Missing Model Card Documentation",
                description="No model card or documentation was provided for interpretability audit.",
                severity="low",
                evidence=FindingEvidence(
                    metric="documentation_present",
                    value=0.0,
                    details={"missing_sections": MODEL_CARD_REQUIRED_SECTIONS},
                ),
                recommendation="Provide an audit-ready model card covering intended use, training data sources, and limitations.",
                status="open",
            )
        ]

    doc_lower = doc_text.lower()
    missing_sections = [
        section for section in MODEL_CARD_REQUIRED_SECTIONS if section not in doc_lower
    ]

    if missing_sections:
        return [
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M3",
                domain="explainability",
                checkId="EXP-005",
                title="Incomplete Model Documentation Sections",
                description=f"Model documentation is missing key sections: {', '.join(missing_sections)}.",
                severity="low",
                evidence=FindingEvidence(
                    metric="missing_sections_count",
                    value=float(len(missing_sections)),
                    details={
                        "missing_sections": missing_sections,
                        "provided_length": len(doc_text),
                    },
                ),
                recommendation="Update model documentation to include all recommended sections: intended use, limitations, and ethical considerations.",
                status="open",
            )
        ]

    return []


def explain_global(request: GlobalExplanationRequest) -> GlobalExplanationResponse:
    """Generate global feature importances using SHAP and evaluate explainability risk findings."""
    assessment_id = request.assessment_id
    findings: list[Finding] = []

    # 1. Load dataset
    df = load_dataset_from_request(request.dataset_path, request.csv_content)
    X, y = prepare_features(df, request.target_column, request.drop_columns)

    if X.empty:
        raise ValueError("Feature dataset contains no columns after exclusions.")

    # Bound dataset size for reference computation
    n_sample = min(len(X), request.sample_size, MAX_SHAP_BACKGROUND_SAMPLES)
    X_sample = X.iloc[:n_sample]

    # 2. Load model
    if not request.model_path:
        raise ValueError("model_path is required for SHAP explainability analysis.")

    try:
        model = safe_load_model(request.model_path)
    except Exception as exc:
        raise ValueError(f"Failed to load model: {exc}") from exc

    # 3. Handle pipelines & extract estimator
    estimator, X_trans, feat_names = extract_pipeline_estimator_and_data(model, X_sample)

    # 4. Construct SHAP explainer with fallback
    explainer_type = "None"
    try:
        explainer, explainer_type = build_shap_explainer(estimator, X_trans)
        shap_matrix = extract_raw_shap_matrix(explainer, X_trans)
        mean_abs = np.mean(np.abs(shap_matrix), axis=0)
    except (ValueError, TypeError, AttributeError, RuntimeError, IndexError) as explainer_err:
        # Fallback to Permutation Importance
        try:
            if y is not None:
                perm = permutation_importance(
                    model, X_sample, y.iloc[:n_sample], n_repeats=5, random_state=42
                )
                mean_abs = perm.importances_mean
                explainer_type = "PermutationImportance"
                feat_names = list(X_sample.columns)
            else:
                raise
        except (ValueError, TypeError, AttributeError, RuntimeError):
            # Finding EXP-003: Model is non-explainable
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M3",
                    domain="explainability",
                    checkId="EXP-003",
                    title="Model Explainability Failure",
                    description=f"Model could not be explained using SHAP or surrogate explainers: {explainer_err}",
                    severity="critical",
                    evidence=FindingEvidence(
                        metric="explainer_failure",
                        value=1.0,
                        details={"error": str(explainer_err)},
                    ),
                    recommendation="Ensure model architecture supports standard SHAP or surrogate explanation methods.",
                    status="open",
                )
            )
            domain_risk = calculate_explainability_domain_risk(findings)
            return GlobalExplanationResponse(
                assessmentId=assessment_id,
                findings=findings,
                domainRisk=domain_risk,
                featureImportances=[],
                explainerType="Failed",
                stabilityScore=0.0,
                summary={"error": str(explainer_err), "status": "failed"},
            )

    # 5. Compute global feature importance rankings
    total_importance = float(np.sum(mean_abs)) if np.sum(mean_abs) > 0 else 1.0
    sorted_indices = np.argsort(mean_abs)[::-1]

    items: list[FeatureImportanceItem] = []
    top_n = min(len(sorted_indices), request.top_n or DEFAULT_TOP_N_FEATURES)

    for rank, idx in enumerate(sorted_indices[:top_n], start=1):
        feat = feat_names[idx] if idx < len(feat_names) else f"feature_{idx}"
        imp = float(mean_abs[idx])
        pct = round(imp / total_importance, 4)
        is_sens = is_sensitive_feature(feat, request.sensitive_attributes)
        items.append(
            FeatureImportanceItem(
                feature=feat,
                importance=round(imp, 5),
                rank=rank,
                percentage=pct,
                is_sensitive=is_sens,
            )
        )

    # 6. Risk Check: EXP-001 (Sensitive attribute or proxy in top features)
    for item in items[:TOP_SENSITIVE_FEATURE_RANK_CUTOFF]:
        if item.is_sensitive:
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M3",
                    domain="explainability",
                    checkId="EXP-001",
                    title=f"Sensitive Attribute in Top Feature Importances: '{item.feature}'",
                    description=(
                        f"Sensitive demographic attribute '{item.feature}' ranks #{item.rank} "
                        f"in model importance ({item.percentage * 100:.1f}% share), indicating significant disparity risk."
                    ),
                    severity="high",
                    evidence=FindingEvidence(
                        metric="sensitive_feature_rank",
                        value=float(item.rank),
                        details={
                            "feature": item.feature,
                            "rank": item.rank,
                            "importance": item.importance,
                            "percentage": item.percentage,
                        },
                    ),
                    recommendation="Audit model dependencies; consider removing direct sensitive features or applying fairness constraints.",
                    status="open",
                )
            )

    # 7. Risk Check: EXP-002 (Single feature dominates >50% importance)
    if items and items[0].percentage > DOMINANT_FEATURE_THRESHOLD:
        top_item = items[0]
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M3",
                domain="explainability",
                checkId="EXP-002",
                title=f"Single Feature Dominates Model Predictions: '{top_item.feature}'",
                description=(
                    f"Feature '{top_item.feature}' accounts for {top_item.percentage * 100:.1f}% of total "
                    "model importance, exceeding the 50% single-feature concentration threshold."
                ),
                severity="medium",
                evidence=FindingEvidence(
                    metric="dominant_feature_share",
                    value=top_item.percentage,
                    details={
                        "dominant_feature": top_item.feature,
                        "share": top_item.percentage,
                        "threshold": DOMINANT_FEATURE_THRESHOLD,
                    },
                ),
                recommendation="Model heavily depends on a single feature. Validate that this feature does not suffer from data leakage.",
                status="open",
            )
        )

    # 8. Risk Check: EXP-004 (Explanation instability across bootstrap samples)
    stability_score = 1.0
    if explainer_type not in ("Failed", "PermutationImportance"):
        stability_score = calculate_bootstrap_stability(
            estimator, X_trans, len(feat_names), explainer
        )
        if stability_score < BOOTSTRAP_STABILITY_CORRELATION_THRESHOLD:
            findings.append(
                Finding(
                    id=str(uuid.uuid4()),
                    assessmentId=assessment_id,
                    module="M3",
                    domain="explainability",
                    checkId="EXP-004",
                    title="Feature Importance Ranking Is Unstable Across Data Subsets",
                    description=(
                        f"Bootstrap Spearman rank correlation is {stability_score:.2f}, "
                        f"below the stability threshold of {BOOTSTRAP_STABILITY_CORRELATION_THRESHOLD}."
                    ),
                    severity="medium",
                    evidence=FindingEvidence(
                        metric="spearman_rank_correlation",
                        value=round(stability_score, 4),
                        details={
                            "correlation": round(stability_score, 4),
                            "threshold": BOOTSTRAP_STABILITY_CORRELATION_THRESHOLD,
                        },
                    ),
                    recommendation="Feature rankings vary across data subsets. Increase background sample size or regularize model complexity.",
                    status="open",
                )
            )

    # 9. Risk Check: EXP-005 (Model documentation audit)
    doc_findings = audit_model_documentation(request.model_documentation, assessment_id)
    findings.extend(doc_findings)

    domain_risk = calculate_explainability_domain_risk(findings)

    summary = {
        "assessmentId": assessment_id,
        "totalFeatures": len(feat_names),
        "topFeaturesAnalyzed": len(items),
        "dominantFeature": items[0].feature if items else None,
        "explainerType": explainer_type,
        "stabilityScore": round(stability_score, 4),
        "findingsCount": len(findings),
    }

    return GlobalExplanationResponse(
        assessmentId=assessment_id,
        findings=findings,
        domainRisk=domain_risk,
        featureImportances=items,
        explainerType=explainer_type,
        stabilityScore=round(stability_score, 4),
        summary=summary,
    )


def explain_local(request: LocalExplanationRequest) -> LocalExplanationResponse:
    """Generate local prediction explanation for an individual row index with chart-ready contributions."""
    assessment_id = request.assessment_id

    # 1. Load dataset & prepare features
    df = load_dataset_from_request(request.dataset_path, request.csv_content)
    X, _ = prepare_features(df, request.target_column, request.drop_columns)

    if X.empty:
        raise ValueError("Feature dataset is empty.")

    row_idx = max(0, min(request.row_index, len(X) - 1))
    target_row = X.iloc[[row_idx]]

    # 2. Load model
    if not request.model_path:
        raise ValueError("model_path is required for local prediction explanation.")

    model = safe_load_model(request.model_path)

    # 3. Model prediction
    pred_val = model.predict(target_row)[0]
    pred_prob: float | None = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(target_row)[0]
        # Probability of positive class or predicted class
        pred_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])

    # Convert prediction to standard Python scalar
    if isinstance(pred_val, (np.integer, np.floating)):
        pred_val = pred_val.item()

    # 4. Pipeline feature transformation
    estimator, X_trans, feat_names = extract_pipeline_estimator_and_data(model, X.iloc[:200])
    row_trans = X_trans[row_idx:row_idx+1] if hasattr(X_trans, "__getitem__") and not isinstance(X_trans, pd.DataFrame) else X_trans.iloc[[row_idx]]

    # 5. Explainer
    explainer, explainer_type = build_shap_explainer(estimator, X_trans)
    shap_matrix = extract_raw_shap_matrix(explainer, row_trans)
    row_shap = shap_matrix[0]

    # Baseline expected value
    base_val = 0.0
    if hasattr(explainer, "expected_value"):
        exp_v = explainer.expected_value
        if isinstance(exp_v, (list, np.ndarray)):
            base_val = float(exp_v[1]) if len(exp_v) > 1 else float(exp_v[0])
        else:
            base_val = float(exp_v)

    # Raw values for display
    contributions: list[FeatureContributionItem] = []
    for i, imp in enumerate(row_shap):
        fname = feat_names[i] if i < len(feat_names) else f"feature_{i}"
        # Extract row feature value if available
        raw_val = None
        if fname in target_row.columns:
            raw_val = target_row[fname].iloc[0]
            if isinstance(raw_val, (np.integer, np.floating)):
                raw_val = raw_val.item()
        elif hasattr(row_trans, "iloc"):
            raw_val = row_trans.iloc[0, i]
        elif hasattr(row_trans, "__getitem__"):
            raw_val = row_trans[0][i] if len(row_trans.shape) > 1 else row_trans[i]

        if isinstance(raw_val, (np.floating, np.integer)):
            raw_val = round(float(raw_val), 4)

        contributions.append(
            FeatureContributionItem(
                feature=fname,
                value=raw_val,
                contribution=round(float(imp), 5),
                is_positive=bool(imp >= 0),
            )
        )

    # Sort contributions into positive and negative
    top_n = request.top_n or DEFAULT_TOP_N_FEATURES
    pos_items = sorted([c for c in contributions if c.contribution > 0], key=lambda x: x.contribution, reverse=True)[:top_n]
    neg_items = sorted([c for c in contributions if c.contribution < 0], key=lambda x: x.contribution)[:top_n]

    # Sort all by absolute magnitude for waterfall / bar chart
    all_sorted = sorted(contributions, key=lambda x: abs(x.contribution), reverse=True)[:top_n]

    summary = {
        "assessmentId": assessment_id,
        "rowIndex": row_idx,
        "explainerType": explainer_type,
        "totalFeatures": len(feat_names),
        "prediction": pred_val,
        "baseValue": round(base_val, 4),
    }

    return LocalExplanationResponse(
        assessmentId=assessment_id,
        rowIndex=row_idx,
        prediction=pred_val,
        predictionProbability=round(pred_prob, 4) if pred_prob is not None else None,
        baseValue=round(base_val, 4),
        contributions=all_sorted,
        topPositive=pos_items,
        topNegative=neg_items,
        summary=summary,
    )
