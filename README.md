# AegisAI – AI Trust, Risk & Compliance Auditor

> "A cybersecurity scanner, but for AI systems."

AegisAI audits AI/ML systems **before deployment** for data quality, fairness, security, explainability and governance risk, then produces a single AI Risk Score (0–100) and an audit-ready report.

**Team:** Garima Sethi (25MCAN0293), Ankita Sharma (25MCAN0033) | **Guide:** Ms. Shaifali

## Modules
| ID | Module | Docs |
|----|--------|------|
| M1 | AI System & Assessment Intake | [docs/modules/M1_intake.md](docs/modules/M1_intake.md) |
| M2 | Data & Model Risk Analysis | [docs/modules/M2_data_model_risk.md](docs/modules/M2_data_model_risk.md) |
| M3 | AI Security & Explainability | [docs/modules/M3_security_explainability.md](docs/modules/M3_security_explainability.md) |
| M4 | Governance & Control Mapping | [docs/modules/M4_governance.md](docs/modules/M4_governance.md) |
| M5 | Risk Scoring, Dashboard & Reporting | [docs/modules/M5_scoring_dashboard_reporting.md](docs/modules/M5_scoring_dashboard_reporting.md) |

Rule: **a module is not "done" until its documentation is written** (see Definition of Done in AGENTS.md).

## Architecture
```
web/          Next.js (App Router) + TypeScript + Tailwind + Prisma  -> UI + API routes + PostgreSQL
ml-service/   FastAPI + pandas/scikit-learn/SHAP                    -> stateless analysis engines
docs/         Architecture + per-module documentation
sample_data/  Demo datasets (HR recruitment case study)
```
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start
```bash
cp .env.example .env
docker compose up -d db
cd web && npm install && npx prisma migrate dev && npm run dev
cd ../ml-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
```
