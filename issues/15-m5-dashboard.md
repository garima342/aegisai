---
title: [M5-B] Dashboard: overall risk score, severity visualisations, prioritised actions
labels: module:M5,frontend
milestone: M5 - Scoring, Dashboard & Reporting
---
## Context
Depends on [M5-A].

## Tasks
- [ ] Assessment overview page: big risk score card (X / 100 with band colour and badge), coverage indicator, donut "Risk breakdown by domain", horizontal bars for domain contributions, severity distribution chart, findings count by module.
- [ ] "Top priority actions" list: findings ranked by severity x domain weight with recommendation and a link to the tracker.
- [ ] Score trend line across assessment runs (history from ScoreSnapshot) with before/after delta.
- [ ] Global dashboard `/`: all systems with latest score, band, last assessed, filters/sort, portfolio summary (counts by band).
- [ ] "Run full assessment" button that orchestrates M2 -> M3 -> M4 -> score with step progress.
- [ ] Empty/loading/error states; responsive.

## Acceptance criteria
- [ ] Dashboard for the HR example shows a High-risk score with correct domain chart and prioritised actions.

## Prompt for coding agent
Build the M5 dashboards in `web/` with Recharts and Tailwind. Read `AGENTS.md`. Consume the scoring API from [M5-A]; do not recompute scores in the frontend. Match the maroon theme from the deck: score card in dark maroon with large serif number and a coloured band pill. Implement the orchestrated "Run full assessment" flow with a step progress UI. Add component tests for the score card and charts' data mapping.
