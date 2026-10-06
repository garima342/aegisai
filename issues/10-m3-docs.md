---
title: [M3-D] Document Module M3 (Security & Explainability)
labels: module:M3,documentation
milestone: M3 - Security & Explainability
---
## Tasks
- [ ] Complete `docs/modules/M3_security_explainability.md`.
- [ ] Table of all test cases (ID, category, OWASP LLM ref, MITRE ATLAS ref, severity, what a "fail" means).
- [ ] Explain the canary technique, judge logic (rule-based + LLM), safeguards, consent flow and ethical-use statement.
- [ ] Explain SHAP global/local, the 5 explainability checks and their thresholds with a worked example.
- [ ] API docs, run/test instructions, screenshots, limitations (probe coverage is not a full pentest).

## Prompt for coding agent
Document M3 in `docs/modules/M3_security_explainability.md` strictly from the real code (`ml-service/app/m3/`, web tab, API routes). Generate the test-case table by reading the YAML files. Include a Mermaid sequence diagram of a security scan, the safeguards list, an "ethical use" section, API examples, run/test steps and limitations. Do not invent features.
