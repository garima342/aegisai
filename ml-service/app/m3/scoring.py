"""Security domain risk scoring utilities for Module M3."""

from app.m3.config import SECURITY_DOMAIN_RISK_CAP, SEVERITY_POINTS
from app.models import Finding


def calculate_security_domain_risk(
    findings: list[Finding],
    cap: float = SECURITY_DOMAIN_RISK_CAP,
) -> float:
    """Calculate normalized security domain risk in [0.0, 1.0] from findings.

    Args:
        findings: List of Finding instances generated during security scan.
        cap: Maximum points threshold corresponding to risk = 1.0.

    Returns:
        Float value between 0.0 (no risk) and 1.0 (maximum risk), rounded to 4 decimals.
    """
    security_findings = [f for f in findings if f.domain == "security"]
    total_points = sum(SEVERITY_POINTS.get(f.severity, 0.0) for f in security_findings)

    if cap <= 0:
        return 1.0 if total_points > 0 else 0.0

    risk = min(1.0, total_points / cap)
    return round(risk, 4)
