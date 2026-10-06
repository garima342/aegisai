# AGENTS.md – Instructions for AI coding agents (VS Code Copilot / Antigravity / Claude Code)

Read this file fully before working on ANY issue.

## Project
AegisAI audits AI/ML systems pre-deployment and outputs a 0–100 risk score (higher = riskier) + audit-ready report.
Five modules: M1 Intake, M2 Data & Model Risk, M3 Security & Explainability, M4 Governance Mapping, M5 Scoring/Dashboard/Reporting.

## Stack (do not change without opening an issue)
- `web/`: Next.js 14+ App Router, TypeScript (strict), Tailwind CSS, Prisma ORM, PostgreSQL, Zod validation, Recharts for charts.
- `ml-service/`: Python 3.11, FastAPI, pydantic v2, pandas, numpy, scikit-learn, SHAP, pytest.
- Web API routes own persistence (PostgreSQL). `ml-service` is STATELESS: it receives data, returns JSON findings. It never touches the DB.
- Uploaded files go through a `StorageProvider` interface (local disk in dev, swappable for cloud storage in prod).
- LLM calls go through one `LLMClient` wrapper with a mock mode (env `LLM_MODE=mock|live`) so everything works without an API key.

## Shared data contract: Finding
Every analysis engine returns findings in this shape (keep identical in Pydantic + Zod + Prisma):
```json
{
  "id": "uuid",
  "assessmentId": "uuid",
  "module": "M2|M3|M4",
  "domain": "data_quality|fairness|security|explainability|governance",
  "checkId": "DQ-001",
  "title": "string",
  "description": "string",
  "severity": "low|medium|high|critical",
  "evidence": { "metric": "...", "value": 0.0, "details": {} },
  "recommendation": "string",
  "status": "open|in_progress|resolved|accepted_risk"
}
```
Severity points: low=1, medium=3, high=6, critical=10.

## Conventions
- Branches: `feature/<issue-number>-short-name`. One issue = one branch = one PR. Commit messages: Conventional Commits (`feat(m2): ...`).
- Every PR must `Closes #<issue>` and fill the PR template.
- TypeScript: no `any`, validate all API input with Zod. Python: type hints + docstrings, `ruff` clean.
- Each check/engine is a small pure function with unit tests (pytest / vitest). Use fixtures from `sample_data/`.
- Secrets only via `.env` (never commit). Provide `.env.example` entries for every new variable.
- UI: clean, professional; dark maroon (#5C1A2B) + warm neutral palette; show loading, empty and error states.
- Security-testing code must only target apps the user registered, use harmless test payloads, and never exfiltrate real data.

## Definition of Done (per module – enforced by teacher requirement)
1. Code works end-to-end and tests pass (`npm test`, `pytest`).
2. Lint/typecheck pass.
3. **Module documentation is written** at `docs/modules/<module>.md` (purpose, architecture, data model, API endpoints with examples, how checks work, how to run/test, screenshots, limitations).
4. README module table updated.
5. PR reviewed by the other team member.

## How to work on an issue
1. Read this file and the issue. 2. Briefly state your plan (files to create/change). 3. Implement in small commits.
4. Run tests/lint. 5. Summarize what you did and anything left open. Do not expand scope beyond the issue; list ideas as comments instead.
