---
title: [F2] Deployment: Vercel (web), container host (ML service), managed PostgreSQL
labels: deployment,devops
milestone: F1 - Integration & Release
---
## Context
Proposal says Vercel deployment. Python ML dependencies (scikit-learn, SHAP, pandas) are too large for Vercel serverless functions, so the ML service goes on a container host.

## Tasks
- [ ] `ml-service/Dockerfile` (slim, non-root, healthcheck) and deploy to Render/Railway/Fly (free tier).
- [ ] Managed PostgreSQL (Neon/Supabase), run Prisma migrations in deploy pipeline.
- [ ] Vercel project for `web/` with env vars; production uploads use a cloud `StorageProvider` implementation (Vercel Blob or Supabase Storage).
- [ ] ML service protected with an `X-API-Key` shared secret; CORS locked down; `ALLOW_MODEL_LOAD` configured and documented.
- [ ] Basic rate limiting on public API routes; optional simple auth (email/password or GitHub OAuth via NextAuth) so assessment history is per user/org.
- [ ] `docs/DEPLOYMENT.md` with architecture diagram, env var table, and rollback notes.
- [ ] Production smoke test checklist.

## Prompt for coding agent
Prepare production deployment. Read `AGENTS.md`. Write the Dockerfile and deployment config for `ml-service/`, add API-key auth middleware, implement the cloud `StorageProvider`, add NextAuth-based authentication scoped to user/organisation (keep it simple), rate limiting, and `docs/DEPLOYMENT.md`. Never commit secrets; list all env vars in `.env.example` and the doc.
