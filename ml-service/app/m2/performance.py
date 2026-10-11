"""Model performance evaluation and secure model loading for Module M2.

SECURITY WARNING:
Unpickling serialized Python models (.pkl, .pickle, .joblib) involves arbitrary code execution.
Only load models from trusted sources. Model loading is disabled by default and requires
setting the environment variable ALLOW_MODEL_LOAD=true.
"""

import io
import os
import uuid
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

from app.m2.config import (
    ALLOWED_MODEL_EXTENSIONS,
    DEFAULT_TEST_SPLIT_RATIO,
    MAX_MODEL_SIZE_BYTES,
    OVERFITTING_GAP_HIGH,
    OVERFITTING_GAP_MEDIUM,
    PERFORMANCE_ACCURACY_LOW,
    PERFORMANCE_F1_LOW,
    resolve_file_path,
)
from app.models import Finding, FindingEvidence


def is_model_loading_allowed() -> bool:
    """Check if model loading is explicitly enabled via environment variable."""
    return os.getenv("ALLOW_MODEL_LOAD", "false").lower() in ("true", "1", "yes")


def safe_load_model(
    model_input: bytes | str | Path,
    filename: str = "",
) -> Any:
    """Safely deserialize a scikit-learn model with strict validation guards.

    Security checks enforced:
    1. ALLOW_MODEL_LOAD environment flag must be true.
    2. File extension must match allowed list (.pkl, .pickle, .joblib).
    3. File size must not exceed MAX_MODEL_SIZE_BYTES (50MB).

    Raises:
        PermissionError: If ALLOW_MODEL_LOAD is not set to true.
        ValueError: If file extension or size violates safety policy.
        RuntimeError: If deserialization fails.
    """
    if not is_model_loading_allowed():
        raise PermissionError(
            "Model loading is disabled by default for security (unpickling executes arbitrary code). "
            "Set ALLOW_MODEL_LOAD=true in your environment to enable model evaluation."
        )

    # Validate file extension if filename provided
    name_to_check = filename
    if not name_to_check and isinstance(model_input, (str, Path)):
        name_to_check = str(model_input)

    if name_to_check:
        ext = Path(name_to_check).suffix.lower()
        if ext not in ALLOWED_MODEL_EXTENSIONS:
            raise ValueError(
                f"Unsupported model extension '{ext}'. Only {ALLOWED_MODEL_EXTENSIONS} are permitted."
            )

    # Validate size and load
    if isinstance(model_input, bytes):
        if len(model_input) > MAX_MODEL_SIZE_BYTES:
            raise ValueError(
                f"Model file size ({len(model_input)} bytes) exceeds maximum allowable size "
                f"({MAX_MODEL_SIZE_BYTES} bytes)."
            )
        buffer = io.BytesIO(model_input)
        try:
            return joblib.load(buffer)
        except Exception as exc:
            raise RuntimeError(f"Failed to safely load model from bytes: {exc}") from exc

    path = resolve_file_path(model_input)
    if not path.is_file():
        raise FileNotFoundError(f"Model file not found at: {path}")

    file_size = path.stat().st_size
    if file_size > MAX_MODEL_SIZE_BYTES:
        raise ValueError(
            f"Model file size ({file_size} bytes) exceeds maximum allowable limit "
            f"({MAX_MODEL_SIZE_BYTES} bytes)."
        )

    try:
        return joblib.load(path)
    except Exception as exc:
        raise RuntimeError(f"Failed to safely load model from file: {exc}") from exc


def evaluate_model_performance(
    model: Any,
    df: pd.DataFrame,
    target_column: str,
    assessment_id: str = "temp",
    test_df: pd.DataFrame | None = None,
    drop_columns: list[str] | None = None,
) -> tuple[dict[str, Any], list[Finding]]:
    """Compute standard metrics and overfitting gap, returning metrics dict and Findings."""
    findings: list[Finding] = []

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset.")

    drop_cols = set(drop_columns or []) | {target_column}

    if test_df is not None:
        if target_column not in test_df.columns:
            raise ValueError(f"Target column '{target_column}' missing from test dataset.")
        train_data = df.dropna(subset=[target_column])
        test_data = test_df.dropna(subset=[target_column])
    else:
        valid_df = df.dropna(subset=[target_column])
        if len(valid_df) < 10:
            raise ValueError("Dataset has fewer than 10 samples with valid targets.")
        # Stratify if classification with multiple classes
        y_all = valid_df[target_column]
        can_stratify = len(y_all.unique()) > 1 and (y_all.value_counts().min() >= 2)
        train_data, test_data = train_test_split(
            valid_df,
            test_size=DEFAULT_TEST_SPLIT_RATIO,
            random_state=42,
            stratify=y_all if can_stratify else None,
        )

    if hasattr(model, "feature_names_in_"):
        expected_features = list(model.feature_names_in_)
        if all(feat in train_data.columns for feat in expected_features):
            feature_cols = expected_features
        else:
            feature_cols = [c for c in train_data.columns if c not in drop_cols]
    else:
        feature_cols = [c for c in train_data.columns if c not in drop_cols]

    if not feature_cols:
        raise ValueError("No feature columns available after removing target and drop columns.")

    X_train = train_data[feature_cols]
    y_train = train_data[target_column]
    X_test = test_data[feature_cols]
    y_test = test_data[target_column]

    # Convert non-numeric categorical columns to dummy / category codes if model requires
    # Try direct prediction first
    try:
        train_preds = model.predict(X_train)
        test_preds = model.predict(X_test)
    except Exception:  # noqa: BLE001
        # Fallback: dummy encode or numeric coerce for sklearn models expecting numeric X
        combined_X = pd.concat([X_train, X_test], axis=0)
        combined_X = pd.get_dummies(combined_X, drop_first=True)
        X_train_encoded = combined_X.iloc[: len(X_train)]
        X_test_encoded = combined_X.iloc[len(X_train) :]
        train_preds = model.predict(X_train_encoded)
        test_preds = model.predict(X_test_encoded)
        X_test = X_test_encoded

    test_acc = float(accuracy_score(y_test, test_preds))
    train_acc = float(accuracy_score(y_train, train_preds))
    test_prec = float(precision_score(y_test, test_preds, average="weighted", zero_division=0))
    test_rec = float(recall_score(y_test, test_preds, average="weighted", zero_division=0))
    test_f1 = float(f1_score(y_test, test_preds, average="weighted", zero_division=0))

    # ROC-AUC if predict_proba supported
    roc_auc: float | None = None
    try:
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_test)
            if len(np.unique(y_test)) == 2:
                # Binary classification
                roc_auc = float(roc_auc_score(y_test, probs[:, 1]))
            else:
                # Multiclass
                roc_auc = float(roc_auc_score(y_test, probs, multi_class="ovr", average="weighted"))
    except Exception:  # noqa: BLE001
        roc_auc = None

    overfitting_gap = train_acc - test_acc

    metrics = {
        "accuracy": round(test_acc, 4),
        "precision": round(test_prec, 4),
        "recall": round(test_rec, 4),
        "f1": round(test_f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "train_accuracy": round(train_acc, 4),
        "overfitting_gap": round(overfitting_gap, 4),
        "train_samples": len(train_data),
        "test_samples": len(test_data),
    }

    # Check MOD-001: Low Performance
    if test_acc < 0.55 or test_f1 < 0.50:
        perf_severity = "high"
        perf_flag = True
    elif test_acc < PERFORMANCE_ACCURACY_LOW or test_f1 < PERFORMANCE_F1_LOW:
        perf_severity = "medium"
        perf_flag = True
    else:
        perf_flag = False

    if perf_flag:
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M2",
                domain="explainability",  # Or data_quality / model risk
                checkId="MOD-001",
                title=f"Sub-optimal model performance (Accuracy: {round(test_acc*100, 1)}%, F1: {round(test_f1*100, 1)}%)",
                description=(
                    f"Model achieved test accuracy of {round(test_acc*100, 2)}% and F1 score of "
                    f"{round(test_f1*100, 2)}%, which is below the recommended threshold "
                    f"(Accuracy: {PERFORMANCE_ACCURACY_LOW*100}%, F1: {PERFORMANCE_F1_LOW*100}%)."
                ),
                severity=perf_severity,
                evidence=FindingEvidence(
                    metric="test_accuracy",
                    value=round(test_acc, 4),
                    details=metrics,
                ),
                recommendation=(
                    "Evaluate alternative architectures, feature engineering strategies, or hyperparameter tuning. "
                    "Confirm baseline dataset quality before production deployment."
                ),
                status="open",
            )
        )

    # Check MOD-002: Overfitting Gap
    if overfitting_gap >= OVERFITTING_GAP_HIGH:
        gap_severity = "high"
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M2",
                domain="explainability",
                checkId="MOD-002",
                title=f"Severe model overfitting detected (Train-Test Gap: {round(overfitting_gap*100, 1)}%)",
                description=(
                    f"Model exhibits significant generalization failure: training accuracy ({round(train_acc*100, 1)}%) "
                    f"exceeds test accuracy ({round(test_acc*100, 1)}%) by {round(overfitting_gap*100, 2)}%."
                ),
                severity=gap_severity,
                evidence=FindingEvidence(
                    metric="generalization_gap",
                    value=round(overfitting_gap, 4),
                    details={
                        "train_accuracy": round(train_acc, 4),
                        "test_accuracy": round(test_acc, 4),
                        "gap": round(overfitting_gap, 4),
                    },
                ),
                recommendation=(
                    "Apply regularization (L1/L2 penalties, tree depth constraints, dropout), increase training "
                    "data volume, or apply cross-validation to prevent memorization."
                ),
                status="open",
            )
        )
    elif overfitting_gap >= OVERFITTING_GAP_MEDIUM:
        gap_severity = "medium"
        findings.append(
            Finding(
                id=str(uuid.uuid4()),
                assessmentId=assessment_id,
                module="M2",
                domain="explainability",
                checkId="MOD-002",
                title=f"Moderate model overfitting (Train-Test Gap: {round(overfitting_gap*100, 1)}%)",
                description=(
                    f"Model shows noticeable performance drop between train ({round(train_acc*100, 1)}%) "
                    f"and test ({round(test_acc*100, 1)}%) sets (gap of {round(overfitting_gap*100, 2)}%)."
                ),
                severity=gap_severity,
                evidence=FindingEvidence(
                    metric="generalization_gap",
                    value=round(overfitting_gap, 4),
                    details={
                        "train_accuracy": round(train_acc, 4),
                        "test_accuracy": round(test_acc, 4),
                        "gap": round(overfitting_gap, 4),
                    },
                ),
                recommendation="Tune model complexity or incorporate stronger regularization techniques.",
                status="open",
            )
        )

    return metrics, findings
