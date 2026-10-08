from typing import Any, Literal

from pydantic import BaseModel, Field


class FindingEvidence(BaseModel):
    metric: str
    value: float
    details: dict[str, Any] = Field(default_factory=dict)

class Finding(BaseModel):
    id: str
    assessmentId: str
    module: Literal["M2", "M3", "M4"]
    domain: Literal["data_quality", "fairness", "security", "explainability", "governance"]
    checkId: str
    title: str
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    evidence: FindingEvidence
    recommendation: str
    status: Literal["open", "in_progress", "resolved", "accepted_risk"]
