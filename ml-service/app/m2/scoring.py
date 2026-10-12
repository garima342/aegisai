"""Domain risk calculation and scoring utilities for Module M2."""

from app.m2.config import SEVERITY_POINTS
from app.models import Finding


def calculate_domain_risk(
    findings: list[Finding],
    domain: str,
    cap: float = 20.0,
) -> float:
    """Calculate normalized domain risk in [0.0, 1.0] from findings.

    Each finding adds severity points (low=1, medium=3, high=6, critical=10).
    The total points are divided by the domain risk cap and bounded to 1.0.

    Args:
        findings: List of Finding instances.
        domain: Domain to calculate risk for ('data_quality', 'fairness', etc.).
        cap: Maximum points threshold corresponding to risk = 1.0.

    Returns:
        Float value between 0.0 (no risk) and 1.0 (maximum risk).
    """
    domain_findings = [f for f in findings if f.domain == domain]
    total_points = sum(SEVERITY_POINTS.get(f.severity, 0.0) for f in domain_findings)

    if cap <= 0:
        return 1.0 if total_points > 0 else 0.0

    risk = min(1.0, total_points / cap)
    return round(risk, 4)
