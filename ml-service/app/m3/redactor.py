"""Evidence sanitization, secret redaction, and response truncation utilities."""

import re
from typing import Any

from app.m3.config import (
    DEFAULT_CANARY,
    MAX_EVIDENCE_RESPONSE_CHARS,
    REDACTION_PATTERNS,
)


def redact_text(text: str, canary: str | None = None) -> str:
    """Mask canary tokens, secrets, and authorization credentials from text.

    Args:
        text: Input string to sanitize.
        canary: Specific canary string to mask if provided.

    Returns:
        Sanitized text with secrets replaced by [REDACTED_CANARY] or [REDACTED_SECRET].
    """
    if not text:
        return ""

    sanitized = text

    # Redact explicit canary string
    active_canary = canary or DEFAULT_CANARY
    if active_canary and active_canary in sanitized:
        sanitized = sanitized.replace(active_canary, "[REDACTED_CANARY]")

    # Redact regex patterns
    for pattern in REDACTION_PATTERNS:
        sanitized = re.sub(pattern, "[REDACTED_SECRET]", sanitized, flags=re.IGNORECASE)

    return sanitized


def truncate_text(text: str, max_chars: int = MAX_EVIDENCE_RESPONSE_CHARS) -> str:
    """Truncate text to max_chars with an indicator if truncated."""
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "... [truncated]"


def sanitize_evidence_payload(
    evidence: dict[str, Any], canary: str | None = None
) -> dict[str, Any]:
    """Recursively redact secrets and truncate string fields in an evidence dict.

    Args:
        evidence: Dictionary containing evidence details.
        canary: Optional canary token to redact.

    Returns:
        New sanitized dictionary safe for persistence.
    """
    sanitized: dict[str, Any] = {}
    for key, value in evidence.items():
        if isinstance(value, str):
            clean = redact_text(value, canary=canary)
            if key in ("response", "response_excerpt", "output", "prompt"):
                clean = truncate_text(clean)
            sanitized[key] = clean
        elif isinstance(value, dict):
            sanitized[key] = sanitize_evidence_payload(value, canary=canary)
        elif isinstance(value, list):
            sanitized[key] = [
                redact_text(item, canary=canary) if isinstance(item, str) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    return sanitized
