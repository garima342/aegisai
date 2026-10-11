"""Unit tests for domain risk calculation and scoring."""

from app.m2.scoring import calculate_domain_risk
from app.models import Finding, FindingEvidence


def _make_finding(domain: str, severity: str) -> Finding:
    return Finding(
        id="test-id",
        assessmentId="asm-1",
        module="M2",
        domain=domain,  # type: ignore[arg-type]
        checkId="CHK-001",
        title="Test finding",
        description="Test desc",
        severity=severity,  # type: ignore[arg-type]
        evidence=FindingEvidence(metric="m", value=1.0),
        recommendation="Fix it",
        status="open",
    )


def test_calculate_domain_risk():
    # Empty
    assert calculate_domain_risk([], "data_quality") == 0.0

    # 1 medium finding in data_quality (points = 3.0, cap = 20.0 -> 3/20 = 0.15)
    f1 = _make_finding("data_quality", "medium")
    assert calculate_domain_risk([f1], "data_quality", cap=20.0) == 0.15

    # Other domain findings ignored
    f_other = _make_finding("fairness", "critical")
    assert calculate_domain_risk([f1, f_other], "data_quality", cap=20.0) == 0.15

    # Exceeding cap bounds at 1.0
    f_crit1 = _make_finding("fairness", "critical")  # 10
    f_crit2 = _make_finding("fairness", "critical")  # 10
    f_crit3 = _make_finding("fairness", "critical")  # 10 -> total 30 > 20
    assert calculate_domain_risk([f_crit1, f_crit2, f_crit3], "fairness", cap=20.0) == 1.0
