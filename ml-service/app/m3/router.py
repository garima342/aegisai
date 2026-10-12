"""FastAPI router for Module M3 Security testing endpoints."""

from fastapi import APIRouter, HTTPException, status

from app.m3.loader import load_test_cases
from app.m3.runner import run_security_scan
from app.m3.schemas import (
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
