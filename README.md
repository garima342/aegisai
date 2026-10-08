# AegisAI

AegisAI audits AI/ML systems pre-deployment and outputs a 0–100 risk score (higher = riskier) + audit-ready report.

## Tech Stack
- **Web**: Next.js 14+ App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Zod, Recharts.
- **ML Service**: Python 3.11, FastAPI, pydantic, pandas, numpy, scikit-learn, SHAP.

**Team:** Garima Sethi (25MCAN0293), Ankita Sharma (25MCAN0033)

## Quick Start (Under 10 minutes)

### Prerequisites
- Node.js 20+
- Python 3.11
- Docker (for PostgreSQL)

### 1. Database Setup
```bash
docker compose up -d db
```

### 2. Environment Variables
Copy `.env.example` to `.env` in the root and in the `web` directory.
```bash
cp .env.example .env
cp .env.example web/.env
```

### 3. Web UI (Next.js)
```bash
cd web
npm install
npx prisma db push
npm run dev
```

### 4. ML Service (FastAPI)
Open a new terminal and run:
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 5. Access
- Web UI: http://localhost:3000
- ML Service API: http://localhost:8000
- Health Status: http://localhost:3000/health

## Modules
| Module | Description | Status |
|--------|-------------|--------|
| M1 | Intake | Skeleton |
| M2 | Data & Model Risk | Skeleton |
| M3 | Security & Explainability | Skeleton |
| M4 | Governance Mapping | Skeleton |
| M5 | Scoring/Dashboard/Reporting | Skeleton |
