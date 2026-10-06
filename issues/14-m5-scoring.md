---
title: [M5-A] Risk scoring engine (domain-wise and overall AI risk score)
labels: module:M5,backend
milestone: M5 - Scoring, Dashboard & Reporting
---
## Context
M5 combines all findings into domain-wise and overall scores. Depends on M2, M3, M4 outputs (develop against seeded findings if needed).

## Scoring specification
- Severity points: low=1, medium=3, high=6, critical=10.
- Domain raw = sum of points for OPEN and IN_PROGRESS findings (resolved = 0, accepted_risk = 50%).
- Domain risk (0-1) = min(1, raw / domainCap). Caps are configurable constants (default: data_quality 20, fairness 20, security 40, explainability 15, governance 25).
- Weights (sum 100): security 25, fairness 20, data_quality 20, governance 20, explainability 15.
- Domain contribution = weight x domain risk. **Overall score = sum of contributions (0-100).**
- Bands: 0-24 Low, 25-49 Medium, 50-74 High, 75-100 Critical.
- Risk-tier modifier: for `high` systems, multiply by 1.0; for `minimal` 0.9 (document it) – keep optional via config.
- Domains not assessed are excluded and reported as `not_assessed` (do not count as zero risk silently; show a coverage %).

## Tasks
- [ ] Pure TypeScript module `web/lib/scoring/` implementing the spec with a config file, plus `explain()` returning the top contributing findings per domain.
- [ ] `ScoreSnapshot` persistence on each run (assessmentId, overall, band, domain contributions, coverage, configVersion, createdAt).
- [ ] `POST /api/assessments/[id]/score` and `GET /api/assessments/[id]/score` (+ history).
- [ ] Recompute automatically when a finding status changes.
- [ ] Table-driven Vitest tests incl. edge cases (no findings, only one domain, accepted_risk, caps) and a golden test that reproduces the example: domain contributions Fairness 14, Security 18, Explainability 12, Governance 16, Data Quality 12 -> overall 72, band High.

## Acceptance criteria
- [ ] Scoring is deterministic, documented and covered by tests.
- [ ] Changing a finding to resolved lowers the score and creates a new snapshot.

## Prompt for coding agent
Implement the scoring engine exactly per the spec above in `web/lib/scoring/` as pure, well-tested TypeScript, then expose the API routes and persistence. Read `AGENTS.md`. Put every constant in `config.ts` with a `CONFIG_VERSION`. Include the golden test from the Tasks. Handle un-assessed domains explicitly with coverage reporting. No UI in this issue.
