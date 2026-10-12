"""Pydantic schemas for Module M2 request and response contracts."""

from typing import Any

from pydantic import BaseModel, Field

from app.models import Finding


class DataQualityRequest(BaseModel):
    assessment_id: str = Field(default="temp", description="Associated assessment UUID")
    csv_content: str | None = Field(default=None, description="Inline raw CSV string")
    dataset_path: str | None = Field(default=None, description="Path to CSV file on disk")
    target_column: str | None = Field(default=None, description="Name of the target / label column")
    sensitive_attributes: list[str] | None = Field(
        default=None, description="Explicit user-declared sensitive attributes"
    )


class DataQualityResponse(BaseModel):
    assessmentId: str
    findings: list[Finding]
    domainRisk: float = Field(description="Normalized data quality risk score [0.0, 1.0]")
    summary: dict[str, Any]
    detectedSensitiveAttributes: list[str]


class ModelPerformanceRequest(BaseModel):
    assessment_id: str = Field(default="temp", description="Associated assessment UUID")
    dataset_path: str | None = Field(default=None, description="Path to CSV file")
    csv_content: str | None = Field(default=None, description="Inline raw CSV string")
    model_path: str | None = Field(default=None, description="Path to .pkl or .joblib model")
    target_column: str = Field(description="Name of the target column")
    drop_columns: list[str] | None = Field(default=None, description="Columns to exclude from features")


class ModelPerformanceResponse(BaseModel):
    assessmentId: str
    findings: list[Finding]
    domainRisk: float = Field(description="Normalized model performance risk score [0.0, 1.0]")
    metrics: dict[str, Any]


class FairnessRequest(BaseModel):
    assessment_id: str = Field(default="temp", description="Associated assessment UUID")
    dataset_path: str | None = Field(default=None, description="Path to CSV file")
    csv_content: str | None = Field(default=None, description="Inline raw CSV string")
    sensitive_attributes: list[str] | None = Field(
        default=None, description="Sensitive columns to audit"
    )
    prediction_column: str = Field(description="Column containing model predictions (0 or 1)")
    target_column: str | None = Field(default=None, description="Optional ground truth column")


class FairnessResponse(BaseModel):
    assessmentId: str
    findings: list[Finding]
    domainRisk: float = Field(description="Normalized fairness risk score [0.0, 1.0]")
    metrics: dict[str, Any]


class FullAnalysisResponse(BaseModel):
    assessmentId: str
    findings: list[Finding]
    dataQualityRisk: float
    fairnessRisk: float
    modelRisk: float
    overallRisk: float
    metrics: dict[str, Any]
