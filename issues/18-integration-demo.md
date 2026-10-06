---
title: [F1] End-to-end integration, HR Recruitment AI case study and demo data
labels: integration,testing
milestone: F1 - Integration & Release
---
## Tasks
- [ ] Single seed command creating the full "HR Recruitment AI" case study (system, dataset, model, doc with deliberate gaps, vulnerable mock LLM app) so the full pipeline yields roughly the example result (High risk, ~72/100).
- [ ] E2E tests (Playwright): register system -> upload -> run full assessment -> dashboard shows score -> governance mapping present -> report downloads.
- [ ] Performance pass: a full assessment on the sample data completes in < 60 s; add progress feedback.
- [ ] Error-handling audit across modules; consistent error toasts.
- [ ] Demo script (`docs/DEMO.md`): 5-minute walkthrough for the viva with talking points per module.
- [ ] Fix integration bugs found along the way.

## Prompt for coding agent
Own the end-to-end integration. Read `AGENTS.md`. Create the seed command for the HR case study (tune only the demo data, not the scoring logic, to land near a High-risk result) and write Playwright E2E tests covering the full flow. Profile and fix slow steps, harmonise error handling, and write `docs/DEMO.md` as a presenter script. Report any cross-module contract mismatches you fix.
