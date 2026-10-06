---
title: [M1-B] Intake: multi-step registration wizard UI
labels: module:M1,frontend
milestone: M1 - Intake
---
## Context
Depends on [M1-A]. Users (AI developers, compliance officers) register a system and prepare an assessment.

## Goal
A polished 3-step wizard matching the intake flow: Register system -> Define model type & risk context -> Upload model, dataset & docs -> Review & scope.

## Tasks
- [ ] `/systems` list page (cards/table, search, risk-tier badge, "New system" button, empty state).
- [ ] `/systems/new` wizard with progress indicator, per-step validation (Zod + react-hook-form), draft saved between steps.
- [ ] Step 2 shows the suggested risk tier from the backend helper with an explanation, user can override.
- [ ] Step 3 drag-and-drop uploads with progress, file list, remove, type/size hints; LLM-app systems get an endpoint/system-prompt form instead of a model upload.
- [ ] Step 4 review screen: choose assessment scope (data risk / security / governance) and "Create assessment" button.
- [ ] `/systems/[id]` detail page showing metadata, artifacts and its assessments.
- [ ] Loading, error and empty states; fully responsive; keyboard accessible.

## Acceptance criteria
- [ ] A user can register the HR Recruitment AI example end-to-end from the UI.
- [ ] Validation errors shown inline; refreshing mid-wizard does not lose data.
- [ ] Lighthouse accessibility >= 90 on wizard pages.

## Prompt for coding agent
Build the M1 intake UI in `web/` using Next.js App Router, TypeScript, Tailwind and react-hook-form + Zod. Read `AGENTS.md` and consume the API from [M1-A] (do not change backend contracts; if something is missing, note it in a comment). Visual style: dark maroon (#5C1A2B) accents, warm off-white background, rounded cards, clear step indicator. Create reusable components (`Stepper`, `FileDropzone`, `RiskTierBadge`, `Card`). Handle every loading/error/empty state. Add component tests for the wizard validation. Report screenshots-worthy routes when finished.
