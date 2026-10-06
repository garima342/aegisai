---
title: [M3-B] Explainability assessment with SHAP
labels: module:M3,backend,ml
milestone: M3 - Security & Explainability
---
## Context
Part of M3: assess explainability of tabular models and produce model/prediction explanations. Depends on [M2-A] (safe model loading, sample model).

## Tasks
- [ ] `POST /m3/explainability/global`: SHAP global feature importance (TreeExplainer for tree models, LinearExplainer / KernelExplainer fallback with background sample capped for speed). Return top-N features with mean |SHAP|.
- [ ] `POST /m3/explainability/local`: explanation for one row (top positive/negative contributions, base value, prediction).
- [ ] Explainability risk checks -> Findings (domain `explainability`): (a) sensitive attribute or proxy in top features, (b) one feature dominates (>50% importance), (c) model is non-explainable / explainer failed, (d) explanation instability (compare SHAP ranking across 2 bootstrap samples, Spearman correlation < 0.7 flagged), (e) missing model documentation (model card fields absent in uploaded docs - simple keyword check).
- [ ] Return `domainRisk` for `explainability`.
- [ ] Cache/limit: sample at most 500 rows; timeouts; graceful fallback to permutation importance.
- [ ] Tests on `sample_data/hr_model.joblib`: gender (or a proxy) should surface among top features.

## Acceptance criteria
- [ ] Global + local explanation JSON is chart-ready (feature, value, contribution).
- [ ] Failure modes return Findings or clear errors, never a 500 traceback.

## Prompt for coding agent
Implement the explainability engine in `ml-service/app/m3/explain.py` using SHAP and scikit-learn. Read `AGENTS.md`. Reuse the safe model loader from M2. Keep computation bounded (row sampling, timeouts) and add fallbacks. Findings must follow the contract. Write pytest tests using the HR sample model and a tiny linear model. Do not modify the web app.
