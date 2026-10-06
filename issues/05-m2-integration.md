---
title: [M2-B] M2 web integration: run analysis and view data & fairness results
labels: module:M2,frontend,backend
milestone: M2 - Data & Model Risk
---
## Context
Depends on [M2-A], [M1-A], [M1-B]. Connects the web app to the M2 engine and shows results.

## Tasks
- [ ] `POST /api/assessments/[id]/run/data-risk` (web API route): loads dataset/model artifacts, calls `ml-service` M2 endpoints, stores returned Findings in the DB, updates assessment status, stores domain risk values. Idempotent: re-running replaces previous M2 findings.
- [ ] Run in the background pattern: return 202 + status polling endpoint, or a simple job table (document the choice).
- [ ] UI tab "Data & Model Risk" on the assessment page: Run button with progress state, summary cards (data quality / fairness domain risk), findings table (severity badge, check ID, title, evidence expandable, recommendation), filters by severity/domain.
- [ ] Charts (Recharts): approval/selection rate by group (bar, with 80% rule line), missing values per column, class distribution.
- [ ] Handle failures: ML service down, bad file, timeout – show actionable errors.
- [ ] Tests: API route test with mocked `mlClient`.

## Acceptance criteria
- [ ] From the UI, running the HR example shows the gender fairness finding and the group-rate chart.
- [ ] Findings persist after refresh and match the Finding contract.

## Prompt for coding agent
Wire M2 end-to-end. Read `AGENTS.md`. In `web/`, add the run API route using the existing `mlClient` and Prisma, persisting Findings exactly per the contract, then build the "Data & Model Risk" tab with Recharts visualisations and a filterable findings table. Reuse components from M1 where possible. Mock `mlClient` in tests. Do not modify ML service logic; if you need a contract change, describe it in a comment instead. Include loading, error and empty states.
