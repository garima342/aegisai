---
title: [M1-C] Document Module M1 (Intake)
labels: module:M1,documentation
milestone: M1 - Intake
---
## Context
Teacher requirement: when a module is built, its documentation must be done. Do this after [M1-A] and [M1-B] are merged.

## Tasks
- [ ] Complete every section of `docs/modules/M1_intake.md`.
- [ ] Include an ER diagram (Mermaid) for AiSystem/Assessment/Artifact, the intake flow diagram, endpoint table with curl examples, validation rules and upload limits.
- [ ] Add 3+ screenshots under `docs/images/m1/`.
- [ ] Add test instructions and known limitations.
- [ ] Update the README module table status.

## Acceptance criteria
- [ ] A new team member can run and understand M1 using only this document.
- [ ] Documentation matches the actual code (endpoints, fields, limits).

## Prompt for coding agent
Write the documentation for Module M1 in `docs/modules/M1_intake.md`. Read `AGENTS.md`, then read the real code in `web/` (Prisma schema, API routes, wizard components, tests) and document what actually exists – do not invent features. Use Mermaid diagrams (ER + flow), a table of endpoints with example requests/responses, validation and upload rules, how to run and test, and a limitations section. Leave `<!-- screenshot: ... -->` placeholders where screenshots should go. Keep it clear for an academic project report.
