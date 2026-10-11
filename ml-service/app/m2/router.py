"""FastAPI Router for Module M2 (Data & Model Risk Analysis Engine).

Exposes stateless endpoints:
- POST /m2/data-quality
- POST /m2/model-performance
- POST /m2/fairness
- POST /m2/analyze
"""

import io
import json
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException, Request, status

from app.m2.config import (
    DATA_QUALITY_RISK_CAP,
    FAIRNESS_RISK_CAP,
    MAX_CSV_SIZE_BYTES,
    MODEL_PERFORMANCE_RISK_CAP,
)
from app.m2.data_quality import run_data_quality_suite
from app.m2.fairness import evaluate_fairness
from app.m2.imbalance import check_class_imbalance
from app.m2.performance import evaluate_model_performance, safe_load_model
from app.m2.scoring import calculate_domain_risk
from app.m2.sensitive import (
    check_sensitive_attribute_exposure,
    detect_proxy_variables,
    detect_sensitive_attributes,
)
from app.models import Finding

router = APIRouter(prefix="/m2", tags=["Module M2 - Data & Model Risk"])


async def _parse_dataframe_and_params(request: Request) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Parse pandas DataFrame and request parameters from either JSON, Multipart Form, or CSV body."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed JSON payload: {exc}",
            ) from exc

        csv_content = body.get("csv_content")
        dataset_path = body.get("dataset_path")

        if csv_content:
            try:
                df = pd.read_csv(io.StringIO(csv_content))
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to parse CSV string: {exc}",
                ) from exc
        elif dataset_path:
            p = Path(dataset_path)
            if not p.is_file():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dataset file not found at path: {dataset_path}",
                )
            if p.stat().st_size > MAX_CSV_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CSV file exceeds maximum allowable size (100MB).",
                )
            try:
                df = pd.read_csv(p)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to read CSV from path: {exc}",
                ) from exc
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'csv_content' or 'dataset_path' must be provided in JSON payload.",
            )

        return df, body

    elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        try:
            form = await request.form()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse multipart form data: {exc}",
            ) from exc

        params: dict[str, Any] = dict(form)
        file_obj = form.get("file")

        if file_obj and hasattr(file_obj, "read"):
            file_bytes = await file_obj.read()  # type: ignore[attr-defined]
            if len(file_bytes) > MAX_CSV_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file exceeds 100MB limit.",
                )
            try:
                df = pd.read_csv(io.BytesIO(file_bytes))
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to parse uploaded CSV: {exc}",
                ) from exc
        elif form.get("dataset_path"):
            p = Path(str(form["dataset_path"]))
            if not p.is_file():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dataset file not found at path: {p}",
                )
            try:
                df = pd.read_csv(p)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to read CSV file: {exc}",
                ) from exc
        elif form.get("csv_content"):
            try:
                df = pd.read_csv(io.StringIO(str(form["csv_content"])))
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to parse csv_content form field: {exc}",
                ) from exc
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing CSV file or 'csv_content' in multipart upload.",
            )

        # Parse list fields if present
        if "sensitive_attributes" in params:
            raw_sens = params["sensitive_attributes"]
            if isinstance(raw_sens, str):
                try:
                    params["sensitive_attributes"] = json.loads(raw_sens)
                except (json.JSONDecodeError, ValueError):
                    params["sensitive_attributes"] = [
                        s.strip() for s in raw_sens.split(",") if s.strip()
                    ]

        return df, params

    elif "text/csv" in content_type:
        raw_body = await request.body()
        if len(raw_body) > MAX_CSV_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV payload exceeds 100MB limit.",
            )
        try:
            df = pd.read_csv(io.BytesIO(raw_body))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse raw CSV body: {exc}",
            ) from exc
        return df, {}

    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported Content-Type: '{content_type}'. Expected application/json, multipart/form-data, or text/csv.",
        )


@router.post("/data-quality")
async def analyze_data_quality(request: Request) -> dict[str, Any]:
    """Run comprehensive Data Quality analysis.

    Checks included:
    - Missing values (DQ-001)
    - Duplicate rows (DQ-002)
    - Constant columns (DQ-003)
    - Outliers (IQR) (DQ-004)
    - Mixed types (DQ-005)
    - High-cardinality categorical columns (DQ-006)
    - Target class imbalance (DQ-007)
    - Sensitive attribute exposure (DQ-008)
    - Proxy variable correlation (DQ-009)
    """
    df, params = await _parse_dataframe_and_params(request)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided dataset contains zero rows.",
        )

    assessment_id = str(params.get("assessment_id", "temp"))
    target_column = params.get("target_column")
    raw_sensitive = params.get("sensitive_attributes")
    declared_sens: list[str] | None = None
    if isinstance(raw_sensitive, list):
        declared_sens = [str(x) for x in raw_sensitive]
    elif isinstance(raw_sensitive, str) and raw_sensitive:
        declared_sens = [s.strip() for s in raw_sensitive.split(",") if s.strip()]

    findings: list[Finding] = []

    # 1. Base Data Quality checks (DQ-001 through DQ-006)
    findings.extend(run_data_quality_suite(df, assessment_id))

    # 2. Class Imbalance (DQ-007) if target column specified
    if target_column:
        if target_column not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target column '{target_column}' does not exist in dataset.",
            )
        findings.extend(check_class_imbalance(df, target_column, assessment_id))

    # 3. Sensitive Attributes & Proxy Exposure (DQ-008, DQ-009)
    detected_sens = detect_sensitive_attributes(list(df.columns), declared_sens)
    if detected_sens:
        findings.extend(check_sensitive_attribute_exposure(df, detected_sens, assessment_id))
        findings.extend(
            detect_proxy_variables(
                df=df,
                sensitive_columns=detected_sens,
                target_column=target_column,
                assessment_id=assessment_id,
            )
        )

    # Calculate domain risk scores
    dq_risk = calculate_domain_risk(findings, domain="data_quality", cap=DATA_QUALITY_RISK_CAP)
    fairness_risk = calculate_domain_risk(findings, domain="fairness", cap=FAIRNESS_RISK_CAP)

    return {
        "assessmentId": assessment_id,
        "findings": [f.model_dump() for f in findings],
        "domainRisk": dq_risk,
        "fairnessRisk": fairness_risk,
        "detectedSensitiveAttributes": detected_sens,
        "summary": {
            "totalRows": len(df),
            "totalColumns": len(df.columns),
            "columns": list(df.columns),
            "totalFindings": len(findings),
            "severityBreakdown": {
                "critical": sum(1 for f in findings if f.severity == "critical"),
                "high": sum(1 for f in findings if f.severity == "high"),
                "medium": sum(1 for f in findings if f.severity == "medium"),
                "low": sum(1 for f in findings if f.severity == "low"),
            },
        },
    }


@router.post("/model-performance")
async def evaluate_performance_endpoint(request: Request) -> dict[str, Any]:
    """Evaluate trained scikit-learn model performance and generalization gap.

    Checks:
    - Model deserialization safety (extension, size, ALLOW_MODEL_LOAD guard)
    - Test accuracy, precision, recall, F1, ROC-AUC
    - Train-test overfitting gap (MOD-002)
    - Baseline performance thresholds (MOD-001)
    """
    content_type = request.headers.get("content-type", "")
    df: pd.DataFrame
    params: dict[str, Any]
    model_obj: Any = None

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        params = dict(form)
        target_column = form.get("target_column")
        if not target_column:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: 'target_column'",
            )

        # Parse CSV
        file_obj = form.get("file")
        if file_obj and hasattr(file_obj, "read"):
            file_bytes = await file_obj.read()  # type: ignore[attr-defined]
            try:
                df = pd.read_csv(io.BytesIO(file_bytes))
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to parse CSV file: {exc}",
                ) from exc
        elif form.get("dataset_path"):
            p = Path(str(form["dataset_path"]))
            if not p.is_file():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dataset path not found: {p}",
                )
            df = pd.read_csv(p)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset file or dataset_path required.",
            )

        # Parse Model
        model_file = form.get("model_file")
        model_path = form.get("model_path")

        if model_file and hasattr(model_file, "read"):
            model_bytes = await model_file.read()  # type: ignore[attr-defined]
            filename = getattr(model_file, "filename", "model.joblib")
            try:
                model_obj = safe_load_model(model_bytes, filename=filename)
            except PermissionError as exc:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
            except (ValueError, FileNotFoundError) as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Model loading error: {exc}",
                ) from exc
        elif model_path:
            try:
                model_obj = safe_load_model(str(model_path))
            except PermissionError as exc:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
            except (ValueError, FileNotFoundError) as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Model loading error: {exc}",
                ) from exc
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'model_file' upload or 'model_path' parameter must be provided.",
            )

    elif "application/json" in content_type:
        try:
            params = await request.json()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed JSON: {exc}",
            ) from exc

        target_column = params.get("target_column")
        if not target_column:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: 'target_column'",
            )

        dataset_path = params.get("dataset_path")
        csv_content = params.get("csv_content")
        if dataset_path:
            p = Path(dataset_path)
            if not p.is_file():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dataset not found at {dataset_path}",
                )
            df = pd.read_csv(p)
        elif csv_content:
            df = pd.read_csv(io.StringIO(csv_content))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide 'dataset_path' or 'csv_content'.",
            )

        model_path = params.get("model_path")
        if not model_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field 'model_path'.",
            )

        try:
            model_obj = safe_load_model(model_path)
        except PermissionError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
        except (ValueError, FileNotFoundError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model loading error: {exc}",
            ) from exc
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported Content-Type. Expected application/json or multipart/form-data.",
        )

    assessment_id = str(params.get("assessment_id", "temp"))
    drop_columns = params.get("drop_columns", [])
    if isinstance(drop_columns, str):
        drop_columns = [c.strip() for c in drop_columns.split(",") if c.strip()]

    try:
        metrics, findings = evaluate_model_performance(
            model=model_obj,
            df=df,
            target_column=str(target_column),
            assessment_id=assessment_id,
            drop_columns=drop_columns,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Evaluation error: {exc}",
        ) from exc

    perf_risk = calculate_domain_risk(findings, domain="explainability", cap=MODEL_PERFORMANCE_RISK_CAP)

    return {
        "assessmentId": assessment_id,
        "findings": [f.model_dump() for f in findings],
        "domainRisk": perf_risk,
        "metrics": metrics,
    }


@router.post("/fairness")
async def evaluate_fairness_endpoint(request: Request) -> dict[str, Any]:
    """Audit fairness across sensitive attributes using pure NumPy/Pandas.

    Checks:
    - Demographic Parity difference and ratio (FAIR-001, EEOC 4/5ths rule < 0.80)
    - Equal Opportunity Difference (FAIR-002, TPR gap)
    - Equalized Odds Gap (FAIR-003, max TPR/FPR gap)
    - Subgroup Accuracy Disparity (FAIR-004)
    """
    df, params = await _parse_dataframe_and_params(request)
    prediction_column = params.get("prediction_column")
    if not prediction_column:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required parameter: 'prediction_column'.",
        )

    if prediction_column not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prediction column '{prediction_column}' not found in dataset.",
        )

    target_column = params.get("target_column")
    if target_column and target_column not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_column}' specified but not found in dataset.",
        )

    assessment_id = str(params.get("assessment_id", "temp"))

    raw_sens = params.get("sensitive_attributes")
    sensitive_cols: list[str] = []
    if isinstance(raw_sens, list):
        sensitive_cols = [str(x) for x in raw_sens]
    elif isinstance(raw_sens, str) and raw_sens:
        sensitive_cols = [s.strip() for s in raw_sens.split(",") if s.strip()]

    # If no sensitive attributes declared, auto-detect
    if not sensitive_cols:
        sensitive_cols = detect_sensitive_attributes(list(df.columns))

    if not sensitive_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No sensitive attributes detected or provided for fairness audit.",
        )

    metrics, findings = evaluate_fairness(
        df=df,
        sensitive_columns=sensitive_cols,
        prediction_column=prediction_column,
        target_column=target_column,
        assessment_id=assessment_id,
    )

    fairness_risk = calculate_domain_risk(findings, domain="fairness", cap=FAIRNESS_RISK_CAP)

    return {
        "assessmentId": assessment_id,
        "findings": [f.model_dump() for f in findings],
        "domainRisk": fairness_risk,
        "auditedAttributes": sensitive_cols,
        "metrics": metrics,
    }


@router.post("/analyze")
async def full_m2_analysis(request: Request) -> dict[str, Any]:
    """Run full integrated M2 analysis pipeline (Data Quality + Imbalance + Sensitive + Model + Fairness)."""
    # 1. Parse dataframe and parameters
    df, params = await _parse_dataframe_and_params(request)
    assessment_id = str(params.get("assessment_id", "temp"))
    target_column = params.get("target_column")
    raw_sensitive = params.get("sensitive_attributes")

    declared_sens: list[str] | None = None
    if isinstance(raw_sensitive, list):
        declared_sens = [str(x) for x in raw_sensitive]
    elif isinstance(raw_sensitive, str) and raw_sensitive:
        declared_sens = [s.strip() for s in raw_sensitive.split(",") if s.strip()]

    all_findings: list[Finding] = []

    # Run Data Quality Suite
    dq_findings = run_data_quality_suite(df, assessment_id)
    all_findings.extend(dq_findings)

    # Imbalance
    if target_column and target_column in df.columns:
        all_findings.extend(check_class_imbalance(df, target_column, assessment_id))

    # Sensitive attributes and proxies
    detected_sens = detect_sensitive_attributes(list(df.columns), declared_sens)
    if detected_sens:
        all_findings.extend(check_sensitive_attribute_exposure(df, detected_sens, assessment_id))
        all_findings.extend(
            detect_proxy_variables(
                df=df,
                sensitive_columns=detected_sens,
                target_column=target_column,
                assessment_id=assessment_id,
            )
        )

    # Optional model evaluation & fairness if model / predictions present
    model_path = params.get("model_path")
    model_metrics: dict[str, Any] = {}
    fairness_metrics: dict[str, Any] = {}

    if model_path and target_column and target_column in df.columns:
        try:
            model_obj = safe_load_model(model_path)
            model_metrics, perf_findings = evaluate_model_performance(
                model=model_obj,
                df=df,
                target_column=target_column,
                assessment_id=assessment_id,
            )
            all_findings.extend(perf_findings)

            # Generate predictions on full df for fairness auditing
            if hasattr(model_obj, "feature_names_in_"):
                expected = list(model_obj.feature_names_in_)
                if all(c in df.columns for c in expected):
                    pred_X = df[expected]
                else:
                    pred_X = df[[c for c in df.columns if c != target_column]]
            else:
                pred_X = df[[c for c in df.columns if c != target_column]]
            preds = model_obj.predict(pred_X)
            df["_temp_prediction"] = preds

            if detected_sens:
                fairness_metrics, fair_findings = evaluate_fairness(
                    df=df,
                    sensitive_columns=detected_sens,
                    prediction_column="_temp_prediction",
                    target_column=target_column,
                    assessment_id=assessment_id,
                )
                all_findings.extend(fair_findings)
        except Exception:  # noqa: BLE001, S110
            # Continue gracefully with data quality findings if model evaluation fails or is disabled
            pass
    elif "prediction_column" in params and params["prediction_column"] in df.columns:
        pred_col = params["prediction_column"]
        if detected_sens:
            fairness_metrics, fair_findings = evaluate_fairness(
                df=df,
                sensitive_columns=detected_sens,
                prediction_column=pred_col,
                target_column=target_column,
                assessment_id=assessment_id,
            )
            all_findings.extend(fair_findings)

    dq_risk = calculate_domain_risk(all_findings, domain="data_quality", cap=DATA_QUALITY_RISK_CAP)
    fair_risk = calculate_domain_risk(all_findings, domain="fairness", cap=FAIRNESS_RISK_CAP)
    model_risk = calculate_domain_risk(all_findings, domain="explainability", cap=MODEL_PERFORMANCE_RISK_CAP)
    overall_risk = round(min(1.0, max(dq_risk, fair_risk, model_risk)), 4)

    return {
        "assessmentId": assessment_id,
        "findings": [f.model_dump() for f in all_findings],
        "dataQualityRisk": dq_risk,
        "fairnessRisk": fair_risk,
        "modelRisk": model_risk,
        "overallRisk": overall_risk,
        "detectedSensitiveAttributes": detected_sens,
        "modelMetrics": model_metrics,
        "fairnessMetrics": fairness_metrics,
    }
