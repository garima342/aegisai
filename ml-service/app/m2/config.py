"""M2 Data & Model Risk Analysis Engine - Configuration & Thresholds.

All threshold constants used by M2 checks are defined here so they can be
consistently referenced across checks and documented in docs/modules/M2_data_model_risk.md.
"""

import os
from pathlib import Path
from typing import Final


def resolve_file_path(path_input: str | Path) -> Path:
    """Resolve a relative or absolute file path.

    If the path does not exist relative to current working directory, attempts
    resolving relative to the repository root.
    """
    p = Path(path_input)
    if p.is_file():
        return p
    repo_root = Path(__file__).resolve().parents[3]
    candidate = repo_root / path_input
    if candidate.is_file():
        return candidate
    candidate_cwd = Path("..") / path_input
    if candidate_cwd.is_file():
        return candidate_cwd
    return p

# ---------------------------------------------------------------------------
# Security & Model Loading Settings
# ---------------------------------------------------------------------------
# Unpickling Python objects can execute arbitrary code.
# Model loading is strictly disabled by default in production.
ALLOW_MODEL_LOAD: Final[bool] = os.getenv("ALLOW_MODEL_LOAD", "false").strip().lower() in (
    "true",
    "1",
    "yes",
)
MAX_MODEL_SIZE_BYTES: Final[int] = 50 * 1024 * 1024  # 50 MB
ALLOWED_MODEL_EXTENSIONS: Final[tuple[str, ...]] = (".pkl", ".pickle", ".joblib")
MAX_CSV_SIZE_BYTES: Final[int] = 100 * 1024 * 1024  # 100 MB

# ---------------------------------------------------------------------------
# Data Quality Thresholds
# ---------------------------------------------------------------------------
# Missing values (per column ratio)
MISSING_MEDIUM_THRESHOLD: Final[float] = 0.05  # >5% triggers medium severity
MISSING_HIGH_THRESHOLD: Final[float] = 0.20  # >20% triggers high severity

# Duplicate rows
DUPLICATE_ROWS_MEDIUM_THRESHOLD: Final[float] = 0.05  # >5% duplicates is medium
DUPLICATE_ROWS_LOW_THRESHOLD: Final[float] = 0.00  # >0 duplicates is low

# Constant columns
CONSTANT_COLUMN_MAX_UNIQUE: Final[int] = 1

# Outliers (IQR Method)
OUTLIER_IQR_FACTOR: Final[float] = 1.5
OUTLIER_MEDIUM_THRESHOLD: Final[float] = 0.05  # >5% outliers is medium
OUTLIER_HIGH_THRESHOLD: Final[float] = 0.15  # >15% outliers is high

# High Cardinality (for categorical / text columns)
HIGH_CARDINALITY_RATIO_THRESHOLD: Final[float] = 0.50  # >50% unique values
HIGH_CARDINALITY_MIN_UNIQUE: Final[int] = 20  # minimum distinct count

# Mixed Data Types
MIXED_TYPE_THRESHOLD: Final[float] = 0.01  # >1% mixed entries in column

# ---------------------------------------------------------------------------
# Class Imbalance Thresholds
# ---------------------------------------------------------------------------
# Minority class proportion = min_class_count / total_count
IMBALANCE_CRITICAL_THRESHOLD: Final[float] = 0.02  # <2% minority class
IMBALANCE_HIGH_THRESHOLD: Final[float] = 0.10  # <10% minority class
IMBALANCE_MEDIUM_THRESHOLD: Final[float] = 0.20  # <20% minority class

# ---------------------------------------------------------------------------
# Sensitive Attributes & Proxy Detection
# ---------------------------------------------------------------------------
SENSITIVE_PATTERNS: Final[list[str]] = [
    r"gender",
    r"\bsex\b",
    r"\bage\b",
    r"date_of_birth",
    r"\bdob\b",
    r"birth_date",
    r"race",
    r"ethnicity",
    r"religion",
    r"faith",
    r"caste",
    r"disability",
    r"handicap",
    r"marital",
    r"marriage",
    r"nationality",
    r"citizenship",
    r"zip",
    r"zipcode",
    r"postal",
    r"postal_code",
    r"pincode",
    r"pin_code",
]

# Proxy detection thresholds (correlation / mutual info)
PROXY_CORRELATION_MEDIUM: Final[float] = 0.40  # >= 0.40 correlation is medium
PROXY_CORRELATION_HIGH: Final[float] = 0.70  # >= 0.70 correlation is high
PROXY_MUTUAL_INFO_MEDIUM: Final[float] = 0.30  # normalized mutual info

# ---------------------------------------------------------------------------
# Model Performance & Overfitting Thresholds
# ---------------------------------------------------------------------------
PERFORMANCE_ACCURACY_LOW: Final[float] = 0.70  # Accuracy < 70%
PERFORMANCE_F1_LOW: Final[float] = 0.65  # F1 < 0.65
OVERFITTING_GAP_MEDIUM: Final[float] = 0.10  # Train - Test score gap > 10%
OVERFITTING_GAP_HIGH: Final[float] = 0.20  # Train - Test score gap > 20%
DEFAULT_TEST_SPLIT_RATIO: Final[float] = 0.20

# ---------------------------------------------------------------------------
# Fairness Thresholds
# ---------------------------------------------------------------------------
# Four-Fifths Rule (EEOC standard): ratio of selection rates < 0.80
FOUR_FIFTHS_RULE_THRESHOLD: Final[float] = 0.80
DEMOGRAPHIC_PARITY_DIFF_THRESHOLD: Final[float] = 0.10
EQUAL_OPPORTUNITY_DIFF_THRESHOLD: Final[float] = 0.10  # TPR gap
EQUALIZED_ODDS_DIFF_THRESHOLD: Final[float] = 0.10  # max(TPR gap, FPR gap)
ACCURACY_GAP_THRESHOLD: Final[float] = 0.10  # Accuracy difference between groups

# ---------------------------------------------------------------------------
# Severity Scoring Points & Domain Risk Normalization
# ---------------------------------------------------------------------------
SEVERITY_POINTS: Final[dict[str, float]] = {
    "low": 1.0,
    "medium": 3.0,
    "high": 6.0,
    "critical": 10.0,
}

# Severity point cap to normalize domain risk into [0.0, 1.0]
DATA_QUALITY_RISK_CAP: Final[float] = 20.0
FAIRNESS_RISK_CAP: Final[float] = 20.0
MODEL_PERFORMANCE_RISK_CAP: Final[float] = 20.0
