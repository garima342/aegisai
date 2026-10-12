"""Unit tests for M3 YAML test case loader and validation."""

from app.m3.config import DEFAULT_CANARY
from app.m3.loader import load_test_cases


def test_load_all_test_cases():
    """Verify test case loader parses all categories and meets acceptance criteria counts."""
    cases = load_test_cases()
    assert len(cases) >= 19, f"Expected at least 19 test cases, got {len(cases)}"

    by_category = {}
    for case in cases:
        by_category.setdefault(case.category, []).append(case)

    # Acceptance criteria task minimums:
    # At least: 8 prompt-injection, 6 information-leakage, 3 insecure-output, 2 excessive-agency
    assert len(by_category.get("prompt_injection", [])) >= 8
    assert len(by_category.get("information_leakage", [])) >= 6
    assert len(by_category.get("insecure_output_handling", [])) >= 3
    assert len(by_category.get("excessive_agency", [])) >= 2


def test_test_case_fields_complete():
    """Verify all loaded test cases conform to required schema fields."""
    cases = load_test_cases()
    for case in cases:
        assert case.id.startswith("SEC-")
        assert case.category in [
            "prompt_injection",
            "information_leakage",
            "insecure_output_handling",
            "excessive_agency",
        ]
        assert case.owasp_ref.startswith("LLM")
        assert case.mitre_atlas_ref.startswith("AML.")
        assert len(case.title) > 0
        assert len(case.description) > 0
        assert len(case.prompt) > 0
        assert case.severity in ["low", "medium", "high", "critical"]
        assert len(case.recommendation) > 0


def test_canary_placeholder_substitution():
    """Verify canary placeholder {canary} is properly substituted in prompts."""
    custom_canary = "CUSTOM-CANARY-9999"
    cases = load_test_cases(canary=custom_canary)
    leak_case = next(c for c in cases if c.id == "SEC-LEAK-001")
    assert "{canary}" not in leak_case.prompt
    assert custom_canary in leak_case.prompt

    default_cases = load_test_cases()
    default_leak = next(c for c in default_cases if c.id == "SEC-LEAK-001")
    assert DEFAULT_CANARY in default_leak.prompt


def test_category_filtering():
    """Verify filtering test cases by category subset."""
    pi_cases = load_test_cases(categories=["prompt_injection"])
    assert len(pi_cases) >= 8
    assert all(c.category == "prompt_injection" for c in pi_cases)

    leak_cases = load_test_cases(categories=["information_leakage"])
    assert len(leak_cases) >= 6
    assert all(c.category == "information_leakage" for c in leak_cases)
