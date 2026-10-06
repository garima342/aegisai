---
title: [M3-C] M3 web integration: security scan and explainability UI
labels: module:M3,frontend,backend
milestone: M3 - Security & Explainability
---
## Context
Depends on [M3-A], [M3-B], [M2-B] (pattern for run routes).

## Tasks
- [ ] Web API: `POST /api/assessments/[id]/run/security` and `/run/explainability`, persisting Findings and test results (new `SecurityTestResult` table: testId, category, passed, evidence).
- [ ] Consent step before running a security scan: checkbox "I am authorised to test this system", stored with timestamp and user.
- [ ] UI tab "Security & Explainability": security results grouped by OWASP category with pass/fail and expandable evidence (prompt + redacted response); vulnerabilities-by-category bar chart; SHAP global importance bar chart; "explain a prediction" form (choose a dataset row -> waterfall-style contribution chart).
- [ ] Mock-target toggle for demos ("Use built-in vulnerable demo app").
- [ ] Tests with mocked `mlClient`.

## Acceptance criteria
- [ ] Demo: run scan on the vulnerable mock app from the UI and see findings; explain one HR prediction.

## Prompt for coding agent
Build the M3 integration in `web/`. Read `AGENTS.md`. Add API routes + Prisma model + the "Security & Explainability" tab with Recharts charts (vulnerabilities by category, SHAP importance, local explanation). Implement the consent gate and store it. Follow the patterns established in M2 integration. Never display unredacted secrets. Add loading/error states and tests with mocked ML client.
