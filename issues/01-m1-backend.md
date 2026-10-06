---
title: [M1-A] Intake: AI system registration data model, API and file uploads
labels: module:M1,backend
milestone: M1 - Intake
---
## Context
M1 is the entry point of every assessment: register an AI/ML system, capture its purpose, model type, intended use and risk context, and upload the model, dataset and documentation. Depends on [F0]. Read `AGENTS.md` first.

## Goal
Backend for creating and managing AI systems and assessments, including validated file uploads.

## Tasks
- [ ] Extend Prisma: `AiSystem` (name, description, purpose, intendedUse, modelType enum [tabular_classifier, tabular_regressor, llm_app, rag_system, agent, other], riskTier enum [minimal, limited, high, unacceptable], domainContext e.g. hiring/finance/health, sensitiveAttributes string[], owner), `Assessment` (aiSystemId, status enum [draft, intake_complete, running, completed], scope flags: runDataRisk, runSecurity, runGovernance, createdAt), `Artifact` (assessmentId, kind enum [dataset, model, documentation, llm_config], filename, mime, size, storageKey, uploadedAt).
- [ ] API routes (Zod-validated): `POST/GET /api/systems`, `GET/PATCH/DELETE /api/systems/[id]`, `POST /api/systems/[id]/assessments`, `GET /api/assessments/[id]`, `POST /api/assessments/[id]/artifacts` (multipart), `GET/DELETE` artifacts.
- [ ] Upload rules: dataset `.csv` (<=25MB), model `.pkl/.joblib/.onnx` (<=100MB), docs `.pdf/.md/.txt` (<=10MB). Validate extension, size and MIME; store via `StorageProvider`; never execute uploaded model files in `web/`.
- [ ] For `llm_app` systems store a `llmConfig` (endpoint URL, auth header name/value stored server-side only, system prompt, description) to be used by M3 security tests.
- [ ] A suggested-risk-tier helper: simple rule-based function from domainContext + modelType (e.g. hiring/credit/health -> high) with unit tests.
- [ ] Assessment status transition guard: cannot move to `intake_complete` without required artifacts for the selected scope (dataset for data-risk, llm_config for security).
- [ ] Seed script with the "HR Recruitment AI" example system.

## Acceptance criteria
- [ ] All endpoints return consistent `{data}`/`{error}` JSON with proper status codes.
- [ ] Invalid uploads rejected with clear messages.
- [ ] Vitest tests cover validation, risk-tier helper and status guard.
- [ ] Secrets in llmConfig are never returned by GET endpoints.

## Prompt for coding agent
Implement the M1 backend for AegisAI. Read `AGENTS.md` first. Work in `web/` only. Build the Prisma models, Zod schemas, API routes and upload handling listed in the Tasks, reusing `StorageProvider` from the foundation. Treat uploaded files as untrusted: validate type and size, sanitize filenames, store under generated keys, never load or execute them here. Mask secrets in responses. Write Vitest tests for validation, the risk-tier helper and the status guard, plus a seed script. Do not build UI (that is [M1-B]) and do not document the module yet (that is [M1-C]). End with a summary listing endpoints with example curl requests.
