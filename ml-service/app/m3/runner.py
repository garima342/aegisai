"""Security scan runner orchestrating test case execution, judgment, and evidence capture."""

import time
import uuid
from typing import Any

from app.m3.config import (
    DEFAULT_CANARY,
    MAX_REQUEST_CAP,
)
from app.m3.judge import SecurityJudge
from app.m3.loader import load_test_cases
from app.m3.redactor import sanitize_evidence_payload
from app.m3.schemas import (
    SecurityScanRequest,
    SecurityScanResponse,
    SecurityTestResult,
)
from app.m3.scoring import calculate_security_domain_risk
from app.m3.targets import (
    HttpEndpointTarget,
    MockHardenedTarget,
    MockVulnerableTarget,
)
from app.models import Finding, FindingEvidence


def run_security_scan(request: SecurityScanRequest) -> SecurityScanResponse:
    """Execute end-to-end security audit probes against target and return findings.

    Args:
        request: Validated SecurityScanRequest options.

    Returns:
        SecurityScanResponse with findings, domain risk, test results, and summary.

    Raises:
        ValueError: If consent is missing, target config is invalid, or no tests found.
    """
    if not request.authorized:
        raise ValueError("Security testing requires explicit user authorization consent.")

    active_canary = request.canary or DEFAULT_CANARY

    # Select target implementation
    target: Any
    if request.target_type == "mock_vulnerable":
        target = MockVulnerableTarget(canary=active_canary)
    elif request.target_type == "mock_hardened":
        target = MockHardenedTarget(canary=active_canary)
    elif request.target_type == "http":
        if not request.endpoint_config:
            raise ValueError("endpoint_config must be provided when target_type is 'http'.")
        target = HttpEndpointTarget(request.endpoint_config)
    else:
        raise ValueError(f"Unsupported target_type: {request.target_type}")

    # Load and filter test cases
    test_cases = load_test_cases(
        categories=request.selected_categories,
        canary=active_canary,
    )

    if not test_cases:
        raise ValueError("No matching test cases found for specified categories.")

    # Enforce request cap safeguards
    effective_cap = min(request.request_cap, MAX_REQUEST_CAP)
    test_cases = test_cases[:effective_cap]

    judge = SecurityJudge(
        canary=active_canary,
        use_llm_judge=request.use_llm_judge,
    )

    findings: list[Finding] = []
    test_results: list[SecurityTestResult] = []
    category_summary: dict[str, dict[str, int]] = {}

    start_time = time.time()

    for idx, test_case in enumerate(test_cases):
        # Rate limit between probes
        if idx > 0 and request.rate_limit_delay > 0:
            time.sleep(request.rate_limit_delay)

        # Execute probe against target
        raw_response = target.execute_probe(test_case.prompt)

        # Judge target behavior
        eval_result = judge.evaluate(test_case, raw_response)

        # Prepare sanitized evidence
        raw_evidence = {
            "prompt": test_case.prompt,
            "response_excerpt": raw_response,
            "owasp_ref": test_case.owasp_ref,
            "mitre_atlas_ref": test_case.mitre_atlas_ref,
            "triggered_indicators": eval_result.triggered_indicators,
            "explanation": eval_result.explanation,
            "detector_details": eval_result.detector_details,
        }
        sanitized_evidence = sanitize_evidence_payload(raw_evidence, canary=active_canary)

        finding_id: str | None = None
        if not eval_result.passed:
            finding_id = str(uuid.uuid4())
            finding = Finding(
                id=finding_id,
                assessmentId=request.assessment_id,
                module="M3",
                domain="security",
                checkId=test_case.id,
                title=f"Security Weakness: {test_case.title}",
                description=test_case.description,
                severity=test_case.severity,
                evidence=FindingEvidence(
                    metric="vulnerability_detected",
                    value=1.0,
                    details=sanitized_evidence,
                ),
                recommendation=test_case.recommendation,
                status="open",
            )
            findings.append(finding)

        test_result = SecurityTestResult(
            testId=test_case.id,
            category=test_case.category,
            owasp_ref=test_case.owasp_ref,
            mitre_atlas_ref=test_case.mitre_atlas_ref,
            title=test_case.title,
            passed=eval_result.passed,
            severity=test_case.severity,
            evidence=sanitized_evidence,
            findingId=finding_id,
        )
        test_results.append(test_result)

        # Aggregate category counts
        cat = test_case.category
        if cat not in category_summary:
            category_summary[cat] = {"total": 0, "passed": 0, "failed": 0}
        category_summary[cat]["total"] += 1
        if eval_result.passed:
            category_summary[cat]["passed"] += 1
        else:
            category_summary[cat]["failed"] += 1

    duration = round(time.time() - start_time, 3)
    domain_risk = calculate_security_domain_risk(findings)

    total_count = len(test_results)
    passed_count = sum(1 for r in test_results if r.passed)
    failed_count = sum(1 for r in test_results if not r.passed)

    summary = {
        "assessmentId": request.assessment_id,
        "targetType": request.target_type,
        "totalTests": total_count,
        "passedTests": passed_count,
        "failedTests": failed_count,
        "passRate": round(passed_count / total_count, 4) if total_count > 0 else 1.0,
        "findingsCount": len(findings),
        "durationSeconds": duration,
        "categories": category_summary,
    }

    return SecurityScanResponse(
        assessmentId=request.assessment_id,
        findings=findings,
        domainRisk=domain_risk,
        testResults=test_results,
        summary=summary,
    )
