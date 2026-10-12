"""Loader and validator for Module M3 security test cases from YAML files."""

from pathlib import Path

import yaml

from app.m3.config import DEFAULT_CANARY, SUPPORTED_CATEGORIES
from app.m3.schemas import TestCaseDefinition

TESTCASES_DIR = Path(__file__).parent / "testcases"


def load_test_cases(
    categories: list[str] | None = None,
    canary: str | None = None,
    directory: Path | None = None,
) -> list[TestCaseDefinition]:
    """Load security test case definitions from YAML files.

    Args:
        categories: Optional list of category names to filter (e.g. ['prompt_injection']).
        canary: Active canary string to substitute into prompt templates.
        directory: Optional directory containing YAML files (defaults to app/m3/testcases).

    Returns:
        List of validated TestCaseDefinition instances.
    """
    target_dir = directory or TESTCASES_DIR
    active_canary = canary or DEFAULT_CANARY
    test_cases: list[TestCaseDefinition] = []

    if not target_dir.exists():
        return test_cases

    yaml_files = sorted(target_dir.glob("*.yaml"))
    for file_path in yaml_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if not data or not isinstance(data, list):
                    continue

                for item in data:
                    test_def = TestCaseDefinition(**item)
                    if categories and test_def.category not in categories:
                        continue
                    if categories is None and test_def.category not in SUPPORTED_CATEGORIES:
                        continue

                    # Substitute active canary into prompt if placeholder present
                    if "{canary}" in test_def.prompt:
                        test_def.prompt = test_def.prompt.replace("{canary}", active_canary)

                    test_cases.append(test_def)
        except Exception as exc:
            raise ValueError(f"Failed to load test cases from {file_path}: {exc}") from exc

    return test_cases
