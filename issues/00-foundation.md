---
title: [F0] Project foundation: monorepo, web app, ML service, database, CI
labels: foundation,setup
milestone: F0 - Foundation
---
## Context
AegisAI is an AI Trust, Risk & Compliance Auditor. Before any module is built we need the skeleton all modules plug into. Read `AGENTS.md` first.

## Goal
A running monorepo where `web/` (Next.js) talks to PostgreSQL via Prisma and can call `ml-service/` (FastAPI), with CI and a shared Finding contract.

## Tasks
- [ ] Scaffold `web/`: Next.js App Router + TypeScript strict + Tailwind + ESLint + Vitest. Install Prisma, Zod, Recharts.
- [ ] Prisma schema with base models: `AiSystem`, `Assessment`, `Finding`, `Control`, `ScoreSnapshot` (fields per the Finding contract in AGENTS.md). Initial migration.
- [ ] Scaffold `ml-service/`: FastAPI app (`app/main.py`), `GET /health`, routers folder, pydantic `Finding` model, `requirements.txt`, pytest + ruff config.
- [ ] `web/lib/mlClient.ts`: typed fetch wrapper for `ML_SERVICE_URL` with timeout + error handling.
- [ ] `web/lib/storage.ts`: `StorageProvider` interface + `LocalStorageProvider`.
- [ ] `web/lib/llm.ts` and `ml-service/app/llm.py`: `LLMClient` with `LLM_MODE=mock|live` (mock returns deterministic canned JSON).
- [ ] App shell: sidebar layout (Dashboard, Systems, Assessments, Reports), AegisAI maroon theme, `/` landing page, health page showing DB + ML service status.
- [ ] GitHub Actions: web (lint, typecheck, test) and ml-service (ruff, pytest) on every PR.
- [ ] Update README quick start so a teammate can run everything in under 10 minutes.

## Acceptance criteria
- [ ] `docker compose up -d db`, then web + ml-service start with the README commands.
- [ ] Health page shows both services as green.
- [ ] CI passes on a PR.
- [ ] Folder structure and Finding contract match AGENTS.md.

## Prompt for coding agent
You are setting up the foundation of the AegisAI monorepo. First read `AGENTS.md` and `docs/ARCHITECTURE.md`. Plan the file tree, then implement the Tasks above in small commits. Constraints: TypeScript strict, no `any`; Python 3.11 with type hints; the ML service must be stateless; every env var must be added to `.env.example`. Do NOT implement any module logic (no fairness, scoring, security tests) – only the skeleton, schema, wrappers, shell UI and CI. Finish by running lint, typecheck and tests in both apps and reporting the results and the commands to start everything.
