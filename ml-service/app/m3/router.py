"""FastAPI router for Module M3 Security testing endpoints."""

from fastapi import APIRouter, HTTPException, status

from app.m3.loader import load_test_cases
from app.m3.runner import run_security_scan
from app.m3.schemas import (
    GlobalExplanationRequest,
    GlobalExplanationResponse,
    LocalExplanationRequest,
    LocalExplanationResponse,
    SecurityScanRequest,
    SecurityScanResponse,
    TestCaseDefinition,
)

router = APIRouter(prefix="/m3", tags=["Module M3 - Security"])


@router.post(
    "/security-scan",
    response_model=SecurityScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute automated OWASP LLM security scan",
)
def execute_security_scan(request: SecurityScanRequest) -> SecurityScanResponse:
    """Run an automated security audit probe suite against an LLM target.

    Supports:
    - Built-in mock targets (mock_vulnerable, mock_hardened) for offline demos and verification.
    - External HTTP endpoints registered within an assessment.
    - Controlled test categories: prompt injection, information leakage, insecure output, excessive agency.

    Enforces:
    - User authorization consent requirement.
    - Global request cap safeguards.
    - Evidence secret redaction and output truncation.
    """
    if not request.authorized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security testing requires explicit authorization consent ('authorized' must be true).",
        )

    try:
        return run_security_scan(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security scan encountered an unexpected error: {exc}",
        ) from exc


@router.get(
    "/testcases",
    response_model=list[TestCaseDefinition],
    status_code=status.HTTP_200_OK,
    summary="List available security test case library definitions",
)
def list_security_testcases(
    category: str | None = None,
) -> list[TestCaseDefinition]:
    """Retrieve metadata of test probes in the library for inspection and UI catalog display."""
    categories = [category] if category else None
    return load_test_cases(categories=categories)


@router.post(
    "/explainability/global",
    response_model=GlobalExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute SHAP global feature importances and explainability risk findings",
)
def compute_global_explanation(
    request: GlobalExplanationRequest,
) -> GlobalExplanationResponse:
    """Compute global feature importances with SHAP TreeExplainer/LinearExplainer/Permutation fallback.

    Performs explainability risk checks:
    - EXP-001: Sensitive attributes or proxies in top features.
    - EXP-002: Single feature concentration (>50% importance).
    - EXP-003: Model explainability failure.
    - EXP-004: Explanation instability across bootstrap subsamples (Spearman correlation < 0.7).
    - EXP-005: Model card documentation gap.
    """
    try:
        from app.m3.explain import explain_global

        return explain_global(request)
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Global explanation analysis failed: {exc}",
        ) from exc


@router.post(
    "/explainability/local",
    response_model=LocalExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute local prediction explanation with waterfall-style feature contributions",
)
def compute_local_explanation(
    request: LocalExplanationRequest,
) -> LocalExplanationResponse:
    """Generate row-level SHAP explanation showing positive and negative feature contributions towards a prediction."""
    try:
        from app.m3.explain import explain_local

        return explain_local(request)
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local prediction explanation failed: {exc}",
        ) from exc
