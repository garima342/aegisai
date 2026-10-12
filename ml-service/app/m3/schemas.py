"""Pydantic request and response schemas for Module M3 Security test runner."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models import Finding


class HttpEndpointConfig(BaseModel):
    """Configuration for targeting an external LLM HTTP endpoint."""

    url: str = Field(description="Target endpoint URL (e.g. http://localhost:8000/api/chat)")
    method: Literal["POST", "GET"] = Field(default="POST", description="HTTP method")
    headers: dict[str, str] = Field(default_factory=dict, description="Custom HTTP headers")
    prompt_field: str = Field(default="prompt", description="JSON key for probe prompt payload")
    response_field: str | None = Field(
        default=None, description="Optional path or key to extract response content"
    )
    timeout: float = Field(default=10.0, description="Per-request timeout in seconds")


class SuccessIndicatorRule(BaseModel):
    """Rule defining when a test probe is considered successful (i.e. target failed defense)."""

    type: Literal[
        "canary_leak",
        "keyword_match",
        "regex_match",
        "refusal_absent",
        "system_fragment_leak",
        "script_tag_leak",
        "unauthorized_privilege_granted",
    ]
    keywords: list[str] = Field(default_factory=list)
    patterns: list[str] = Field(default_factory=list)
    refusal_phrases: list[str] = Field(default_factory=list)
    system_fragments: list[str] = Field(default_factory=list)


class TestCaseDefinition(BaseModel):
    """Metadata and execution rules for a single security probe test."""

    __test__ = False

    id: str = Field(description="Unique test ID, e.g. SEC-PI-001")
    category: Literal[
        "prompt_injection",
        "information_leakage",
        "insecure_output_handling",
        "excessive_agency",
    ]
    owasp_ref: str = Field(description="OWASP LLM Top 10 ID, e.g. LLM01")
    mitre_atlas_ref: str = Field(description="MITRE ATLAS technique ID, e.g. AML.T0051")
    title: str = Field(description="Human readable test name")
    description: str = Field(description="Detailed explanation of what the test probes")
    prompt: str = Field(description="Probe prompt text (may contain {canary} placeholder)")
    severity: Literal["low", "medium", "high", "critical"]
    success_indicators: list[dict[str, Any]] = Field(default_factory=list)
    recommendation: str = Field(description="Mitigation guidance")


class SecurityScanRequest(BaseModel):
    """Request payload to initiate an M3 security assessment scan."""

    assessment_id: str = Field(default="temp", description="Associated assessment UUID")
    target_type: Literal["mock_vulnerable", "mock_hardened", "http"] = Field(
        default="mock_vulnerable",
        description="Target backend type: 'mock_vulnerable', 'mock_hardened', or 'http'",
    )
    endpoint_config: HttpEndpointConfig | None = Field(
        default=None, description="Configuration for external target when target_type is 'http'"
    )
    selected_categories: list[str] | None = Field(
        default=None, description="Optional subset of categories to scan"
    )
    canary: str | None = Field(
        default=None, description="Optional custom canary string to inject/probe"
    )
    rate_limit_delay: float = Field(
        default=0.02, description="Delay between probe requests in seconds"
    )
    request_cap: int = Field(
        default=50, description="Safeguard cap on maximum requests per scan"
    )
    authorized: bool = Field(
        default=True,
        description="Explicit consent checkbox: user is authorized to test this target",
    )
    use_llm_judge: bool = Field(
        default=False,
        description="Enable secondary LLM judge evaluation via LLMClient for ambiguous cases",
    )


class SecurityTestResult(BaseModel):
    """Detailed result for an individual probe execution."""

    testId: str
    category: str
    owasp_ref: str
    mitre_atlas_ref: str
    title: str
    passed: bool = Field(
        description="True if target resisted the probe (secure); False if vulnerable"
    )
    severity: Literal["low", "medium", "high", "critical"]
    evidence: dict[str, Any] = Field(default_factory=dict)
    findingId: str | None = Field(
        default=None, description="Finding UUID if this probe failed and produced a Finding"
    )


class SecurityScanResponse(BaseModel):
    """Complete response returned by POST /m3/security-scan."""

    assessmentId: str
    findings: list[Finding]
    domainRisk: float = Field(description="Normalized security domain risk score [0.0, 1.0]")
    testResults: list[SecurityTestResult]
    summary: dict[str, Any]
