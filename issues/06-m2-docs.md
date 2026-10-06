---
title: [M2-C] Document Module M2 (Data & Model Risk)
labels: module:M2,documentation
milestone: M2 - Data & Model Risk
---
## Tasks
- [ ] Complete `docs/modules/M2_data_model_risk.md`.
- [ ] Explain each check: what it measures, formula, thresholds and severity mapping (table), and why it matters (e.g. four-fifths rule).
- [ ] Document fairness metrics with formulas and a worked example using `hr_recruitment.csv`.
- [ ] Document endpoints (ML + web), the model-loading security warning, the sample dataset generation, test instructions, screenshots and limitations (e.g. only tabular models, sklearn only).
- [ ] Update README status.

## Acceptance criteria
- [ ] Every threshold in `ml-service/app/m2/config.py` appears in the doc.

## Prompt for coding agent
Write `docs/modules/M2_data_model_risk.md` based strictly on the real code in `ml-service/app/m2/` and the M2 UI in `web/`. Include formulas (fairness metrics), a threshold table generated from `config.py`, a worked example from the sample HR dataset with actual numbers produced by running the engine, API examples, security note about model loading, run/test instructions and limitations. Use Mermaid for the data flow. Do not invent features.
