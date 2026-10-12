"""Tests for end-to-end M3 security scan runner and acceptance criteria validation."""

import pytest

from app.m3.config import DEFAULT_CANARY
from app.m3.runner import run_security_scan
from app.m3.schemas import SecurityScanRequest


def test_acceptance_criteria_vulnerable_and_hardened_targets():
    """Verify acceptance criteria:

    - Vulnerable mock target yields >= 5 findings across >= 3 categories.
    - Hardened target yields <= 1 findings.
    """
    # 1. Vulnerable mock target run
    vuln_req = SecurityScanRequest(
        assessment_id="test-vuln-assessment",
        target_type="mock_vulnerable",
        authorized=True,
        rate_limit_delay=0.0,
    )
    vuln_resp = run_security_scan(vuln_req)

    assert len(vuln_resp.findings) >= 5, (
        f"Expected >= 5 findings for vulnerable mock, got {len(vuln_resp.findings)}"
    )

    # Check categories involved in findings
    finding_categories = {r.category for r in vuln_resp.testResults if not r.passed}
    assert len(finding_categories) >= 3, (
        f"Expected findings across >= 3 categories, got {len(finding_categories)}: {finding_categories}"
    )

    # Domain risk should reflect significant security risk (> 0.2)
    assert vuln_resp.domainRisk > 0.2

    # 2. Hardened mock target run
    hardened_req = SecurityScanRequest(
        assessment_id="test-hardened-assessment",
        target_type="mock_hardened",
        authorized=True,
        rate_limit_delay=0.0,
    )
    hardened_resp = run_security_scan(hardened_req)

    assert len(hardened_resp.findings) <= 1, (
        f"Expected <= 1 finding for hardened mock, got {len(hardened_resp.findings)}"
    )
    assert hardened_resp.domainRisk <= 0.1


def test_finding_contract_compliance():
    """Verify generated findings strictly comply with AGENTS.md contract."""
    req = SecurityScanRequest(
        assessment_id="test-contract-assessment",
        target_type="mock_vulnerable",
        authorized=True,
        rate_limit_delay=0.0,
    )
    resp = run_security_scan(req)

    assert len(resp.findings) > 0
    for finding in resp.findings:
        assert finding.assessmentId == "test-contract-assessment"
        assert finding.module == "M3"
        assert finding.domain == "security"
        assert finding.checkId.startswith("SEC-")
        assert finding.severity in ["low", "medium", "high", "critical"]
        assert finding.evidence.metric == "vulnerability_detected"
        assert finding.evidence.value == 1.0
        assert isinstance(finding.evidence.details, dict)
        assert finding.status == "open"
        assert len(finding.recommendation) > 0

        # Verify evidence does NOT leak plaintext canary
        details = finding.evidence.details
        if "response_excerpt" in details:
            assert DEFAULT_CANARY not in details["response_excerpt"]


def test_authorization_consent_safeguard():
    """Verify runner rejects scans if authorization consent is missing."""
    req = SecurityScanRequest(
        assessment_id="unauthorized-scan",
        target_type="mock_vulnerable",
        authorized=False,
    )
    with pytest.raises(ValueError, match="authorization consent"):
        run_security_scan(req)


def test_request_cap_enforcement():
    """Verify request cap safeguard bounds total executed probes."""
    req = SecurityScanRequest(
        assessment_id="capped-scan",
        target_type="mock_vulnerable",
        authorized=True,
        request_cap=5,
        rate_limit_delay=0.0,
    )
    resp = run_security_scan(req)
    assert len(resp.testResults) == 5
    assert resp.summary["totalTests"] == 5


def test_category_subset_execution():
    """Verify running scan with selected categories executes only those categories."""
    req = SecurityScanRequest(
        assessment_id="subset-scan",
        target_type="mock_vulnerable",
        selected_categories=["prompt_injection"],
        authorized=True,
        rate_limit_delay=0.0,
    )
    resp = run_security_scan(req)
    assert len(resp.testResults) >= 8
    assert all(r.category == "prompt_injection" for r in resp.testResults)
