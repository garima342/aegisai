---
title: [M5-C] Audit-ready report generation and assessment history
labels: module:M5,backend,frontend
milestone: M5 - Scoring, Dashboard & Reporting
---
## Context
Depends on [M5-A], [M5-B], M4 data.

## Tasks
- [ ] Report data builder: executive summary (LLM-assisted via `LLMClient`, mock-safe, must only use provided data), system details, scope, overall + domain scores, findings by severity with evidence, control mapping tables per framework, remediation plan by priority, assessment metadata (date, version, config version, assessor).
- [ ] Export formats: print-optimised HTML/PDF (`/assessments/[id]/report` page with print CSS + "Download PDF"), and JSON export.
- [ ] Report includes disclaimers: automated pre-deployment assessment, not a legal certification.
- [ ] Assessment history page per system: list of past assessments, score deltas, compare two assessments (new/resolved/persisting findings).
- [ ] Persist generated reports metadata; allow regenerating.
- [ ] Tests for report builder (snapshot) and compare logic.

## Acceptance criteria
- [ ] One click produces a professional multi-page PDF for the HR example with all sections.
- [ ] Comparison view correctly shows resolved vs new findings between two runs.

## Prompt for coding agent
Implement report generation and history in `web/`. Read `AGENTS.md`. Build a pure `buildReport(assessmentId)` returning a typed object, render it as a print-styled page, and add PDF download (use browser print-to-PDF styling or a lightweight server library compatible with Vercel). The LLM executive summary must be grounded only in supplied numbers and findings (pass them in the prompt, forbid invention) and must work in mock mode. Implement assessment comparison logic with tests. Include the legal-style disclaimer.
