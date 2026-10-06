# Architecture

```
Browser -> Next.js (UI + API routes) -> PostgreSQL (assessments, findings, scores, controls, history)
                       |
                       +--> FastAPI ml-service (stateless): data/fairness, SHAP, security-test runner, doc analysis
                       +--> LLM API (via LLMClient; mock mode available)
```

Flow: Intake (M1) -> [M2 | M3 | M4 run on the assessment] -> Scoring (M5) -> Dashboard + Report.

Scoring: overall score = sum of domain contributions; domain contribution = weight x domain risk (0-1).
Weights: security 25, fairness 20, data_quality 20, governance 20, explainability 15 (= 100).
Bands: 0-24 Low, 25-49 Medium, 50-74 High, 75-100 Critical.

Deployment: web on Vercel; ml-service on a container host (Render/Railway/Fly) because scikit-learn + SHAP exceed Vercel's serverless size limit; PostgreSQL on Neon or Supabase.
