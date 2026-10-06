---
title: [M5-D] Document Module M5 (Scoring, Dashboard & Reporting)
labels: module:M5,documentation
milestone: M5 - Scoring, Dashboard & Reporting
---
## Tasks
- [ ] Complete `docs/modules/M5_scoring_dashboard_reporting.md`.
- [ ] Full scoring methodology with formulas, severity points, weights, caps, bands, worked example reproducing the 72/100 case and a sensitivity discussion ("what if we resolve 2 high findings?").
- [ ] Dashboard description, report structure (section by section), history/compare logic, API docs, run/test steps, screenshots, limitations (weights are heuristic and configurable).

## Prompt for coding agent
Write `docs/modules/M5_scoring_dashboard_reporting.md` from the real code in `web/lib/scoring`, dashboard components and report builder. Include the exact constants from `config.ts`, a worked numeric example computed by running the code, Mermaid diagrams (score computation pipeline, report generation), API examples and limitations. Do not invent features.
