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

---

## Module M3: Security Assessment Engine (LLM Test Runner)

Module M3 audits registered AI/LLM applications against **OWASP LLM Top 10** vulnerabilities and **MITRE ATLAS** techniques using controlled, benign probes and automated detectors.

### Architecture (`app/m3/`)

- `config.py`: Thresholds, canary tokens, rate limits, request caps, refusal patterns, and scoring weights.
- `schemas.py`: Pydantic models for scan requests, responses, test cases, and execution results.
- `testcases/`: Curated YAML test libraries across 4 vulnerability domains:
  - `prompt_injection.yaml`: Direct instruction overrides, role-play/debug personas, delimiters, indirect injection, and encoding tricks (OWASP `LLM01`, MITRE `AML.T0051`).
  - `information_leakage.yaml`: System prompt disclosure, canary extraction, internal guidelines, and PII retention (OWASP `LLM06`, MITRE `AML.T0054`).
  - `insecure_output_handling.yaml`: Unescaped `<script>` tags, javascript URIs, and inline event handlers (OWASP `LLM02`, MITRE `AML.T0055`).
  - `excessive_agency.yaml`: Unauthorized privilege assertion and unconfirmed destructive actions (OWASP `LLM08`, MITRE `AML.T0053`).
- `loader.py`: YAML parser, schema validator, and canary placeholder substitutor.
- `targets.py`:
  - `MockVulnerableTarget`: Deterministic vulnerable model for offline testing and demonstrations (yields >= 5 findings across >= 3 categories).
  - `MockHardenedTarget`: Defensive model with active guardrails (yields <= 1 finding).
  - `HttpEndpointTarget`: External HTTP client with configurable timeouts, retries, and rate limiting.
- `judge.py`: Rule-based detector judge (canary detector, refusal detector, keyword matcher, regex matcher, tag detector, system fragment detector) with optional secondary LLM-as-judge evaluation.
- `redactor.py`: Sanitizes and redacts secrets (canaries, bearer tokens, API keys) from stored evidence payloads.
- `scoring.py`: Computes normalized `domainRisk` in `[0.0, 1.0]` with documented cap.
- `runner.py`: Orchestrates execution flow, enforces request caps and authorization checks, and produces `Finding` records.
- `router.py`: FastAPI endpoints for scanning and inspecting test cases.

### Security & Safeguards

1. **Defensive Assessment Only**: All probe payloads are harmless and benign. No real malware, exploit payloads, or real PII are used.
2. **Explicit Authorization Gate**: Probes are rejected with `400 Bad Request` unless `authorized=true` is confirmed.
3. **Request Caps**: Default request cap of 50 requests per session prevents resource exhaustion.
4. **Secret Redaction**: Canary strings, API keys, and Authorization headers are automatically redacted as `[REDACTED_CANARY]` / `[REDACTED_SECRET]` in evidence payloads.

### Example API Calls (curl)

#### 1. Run Automated Security Scan (Built-in Vulnerable Demo App)
```bash
curl -X POST http://localhost:8000/m3/security-scan \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "demo-assessment-123",
    "target_type": "mock_vulnerable",
    "authorized": true
  }'
```

#### 2. Run Scan against Hardened Mock Target
```bash
curl -X POST http://localhost:8000/m3/security-scan \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "demo-assessment-123",
    "target_type": "mock_hardened",
    "authorized": true
  }'
```

#### 3. Inspect Test Case Library Catalog
```bash
curl http://localhost:8000/m3/testcases
```
