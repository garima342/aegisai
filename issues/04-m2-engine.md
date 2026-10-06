---
title: [M2-A] Data & model risk analysis engine (ML service)
labels: module:M2,backend,ml
milestone: M2 - Data & Model Risk
---
## Context
M2 analyzes data quality and model behavior to surface risks accuracy alone misses. Depends on [F0] and [M1-A]. Lives in `ml-service/`. Read `AGENTS.md` first.

## Goal
Stateless endpoints that take a CSV (and optionally a trained model) plus config and return Findings.

## Tasks
- [ ] `POST /m2/data-quality`: missing values per column (flag >5% medium, >20% high), duplicate rows, constant columns, outliers (IQR), mixed types, high-cardinality columns. Check IDs `DQ-001...`.
- [ ] Class imbalance: target distribution, minority ratio, imbalance ratio; severity bands (minority <20% medium, <10% high, <2% critical).
- [ ] Sensitive attribute exposure: user-declared sensitive columns + auto-detect likely ones by name patterns (gender, sex, age, race, religion, caste, disability, marital, nationality, zip/pincode); detect proxy variables via correlation / mutual information with sensitive attributes.
- [ ] `POST /m2/model-performance`: load a scikit-learn `.pkl/.joblib` model SAFELY (see prompt), compute accuracy, precision, recall, F1, ROC-AUC where applicable, plus a held-out split if no test set is provided; flag overfitting (train-test gap) and low performance.
- [ ] `POST /m2/fairness`: for each sensitive attribute compute selection rate by group, demographic parity difference/ratio (flag four-fifths rule: ratio < 0.8), equal opportunity difference (TPR gap), equalized odds gap, accuracy gap. Implement the metrics yourself with numpy/pandas (no heavy fairness libs).
- [ ] Each check returns Findings per the AGENTS.md contract with `evidence` containing the numbers and a plain-English `recommendation`.
- [ ] Domain sub-scores: return `domainRisk` for `data_quality` and `fairness` in 0-1 (severity points normalised by a documented cap).
- [ ] Unit tests with synthetic datasets that trigger each finding; ship `sample_data/hr_recruitment.csv` (~2000 rows, deliberately biased on gender, some missing values, imbalance) and a trained `sample_data/hr_model.joblib` plus the script that generated them.

## Acceptance criteria
- [ ] pytest coverage >= 80% for M2 code.
- [ ] Running on `hr_recruitment.csv` produces a fairness finding for gender (demographic parity ratio < 0.8) and at least 2 data-quality findings.
- [ ] Each endpoint validates input and returns clear 4xx errors.

## Prompt for coding agent
Implement the M2 analysis engine in `ml-service/` (FastAPI + pandas + numpy + scikit-learn). Read `AGENTS.md` for the Finding contract and conventions. Structure: `app/m2/` with `data_quality.py`, `imbalance.py`, `sensitive.py`, `performance.py`, `fairness.py`, `router.py`; each check is a pure function that returns a list of Findings and is unit tested. SECURITY: unpickling a model is code execution – only load models in a restricted helper that checks file extension/size, add a clear warning in docstring and README, and offer an `--allow-model-load` style setting (`ALLOW_MODEL_LOAD=true`) that defaults to false in production. Make thresholds constants in one `config.py` so they can be documented. Generate the synthetic biased HR dataset with a reproducible script (`sample_data/generate_hr.py`, fixed seed). Do not touch `web/`. Finish with test results and example curl calls.
