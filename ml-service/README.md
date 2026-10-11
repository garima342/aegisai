# AegisAI ML Service

Stateless Python microservice built with **FastAPI**, **Pandas**, **NumPy**, and **Scikit-Learn** providing risk analysis engines for AI/ML audits.

---

## ⚠️ Security Notice: Model Deserialization

> **CRITICAL SECURITY WARNING:**  
> Deserializing Python models via `pickle` or `joblib` allows execution of arbitrary bytecode embedded within the payload. Never unpickle untrusted models in production environments without isolation.

To safeguard against remote code execution:
1. **Disabled by default**: Model loading endpoints reject requests with `403 Forbidden` unless the environment variable `ALLOW_MODEL_LOAD=true` is set.
2. **File extension enforcement**: Only `.pkl`, `.pickle`, and `.joblib` files are allowed.
3. **File size bounds**: Payloads larger than 50MB (`MAX_MODEL_SIZE_BYTES`) are rejected immediately.
4. **Isolated execution**: In production, model evaluation runs inside an unprivileged sandbox or container.

To enable model evaluation in local development or trusted test environments:
```bash
# Windows PowerShell
$env:ALLOW_MODEL_LOAD="true"

# Linux / macOS
export ALLOW_MODEL_LOAD="true"
```

---

## Module M2: Data & Model Risk Engine

Module M2 evaluates pre-deployment tabular datasets and models to surface data quality flaws, class imbalance, demographic proxy variables, model overfitting, and disparate impact.

### Architecture (`app/m2/`)

- `config.py`: Centralized thresholds and security constants.
- `data_quality.py`: Pure functions for missing values (`DQ-001`), duplicates (`DQ-002`), constant columns (`DQ-003`), IQR outliers (`DQ-004`), mixed data types (`DQ-005`), and high cardinality (`DQ-006`).
- `imbalance.py`: Target class imbalance detection and severity bands (`DQ-007`).
- `sensitive.py`: Regex pattern matching for sensitive attributes (`DQ-008`) and correlation/mutual-info proxy variable detection (`DQ-009`).
- `performance.py`: Secure model deserialization, test metrics (accuracy, precision, recall, F1, ROC-AUC), baseline checks (`MOD-001`), and overfitting generalization gap (`MOD-002`).
- `fairness.py`: Demographic parity & EEOC Four-Fifths Rule (`FAIR-001`), Equal Opportunity TPR gap (`FAIR-002`), Equalized Odds gap (`FAIR-003`), and subgroup accuracy disparity (`FAIR-004`) implemented with pure NumPy/Pandas.
- `scoring.py`: Severity points summation (low=1, medium=3, high=6, critical=10) normalized into domain risk in `[0.0, 1.0]`.
- `schemas.py`: Pydantic request and response contracts.
- `router.py`: FastAPI endpoints supporting JSON, Multipart form uploads, and raw CSV.

---

## Quickstart & Testing

### 1. Setup Virtual Environment
```bash
cd ml-service
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS
pip install -r requirements.txt
```

### 2. Run Tests & Coverage
```bash
pytest --cov=app/m2 --cov-report=term-missing
```

### 3. Generate Synthetic HR Dataset & Audit Model
```bash
python ../sample_data/generate_hr.py
```

### 4. Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## Example API Calls (curl)

### 1. Data Quality Analysis (Multipart CSV Upload)
```bash
curl -X POST http://localhost:8000/m2/data-quality \
  -F "file=@../sample_data/hr_recruitment.csv" \
  -F "target_column=hired"
```

### 2. Data Quality Analysis (JSON Payload)
```bash
curl -X POST http://localhost:8000/m2/data-quality \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_path": "../sample_data/hr_recruitment.csv",
    "target_column": "hired",
    "sensitive_attributes": ["gender", "age"]
  }'
```

### 3. Fairness Audit
```bash
curl -X POST http://localhost:8000/m2/fairness \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_path": "../sample_data/hr_recruitment.csv",
    "prediction_column": "hired",
    "sensitive_attributes": ["gender"]
  }'
```

### 4. Model Performance Evaluation
```bash
# Requires ALLOW_MODEL_LOAD=true
curl -X POST http://localhost:8000/m2/model-performance \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_path": "../sample_data/hr_recruitment.csv",
    "model_path": "../sample_data/hr_model.joblib",
    "target_column": "hired"
  }'
```

### 5. Full Pipeline Analysis
```bash
curl -X POST http://localhost:8000/m2/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_path": "../sample_data/hr_recruitment.csv",
    "model_path": "../sample_data/hr_model.joblib",
    "target_column": "hired"
  }'
```
