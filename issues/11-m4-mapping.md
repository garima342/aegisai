---
title: [M4-A] Governance control catalog and risk-to-control mapping engine
labels: module:M4,backend
milestone: M4 - Governance Mapping
---
## Context
M4 maps detected risks to recognised frameworks (NIST AI RMF, ISO/IEC 42001, OWASP LLM Top 10, MITRE ATLAS) and tracks evidence, control status and remediation priority. Depends on [F0], and uses findings from M2/M3 (can be developed in parallel with seeded findings).

## Tasks
- [ ] Control catalog as versioned JSON in `web/data/controls/` (`nist_ai_rmf.json`, `iso_42001.json`, `owasp_llm.json`, `mitre_atlas.json`). Each control: framework, controlId, title, short original-wording description (do NOT copy long copyrighted text, summarise), function/category (e.g. NIST GOVERN/MAP/MEASURE/MANAGE), tags. Include ~15-25 relevant controls per framework (OWASP LLM01-LLM10 complete; NIST subcategories relevant to fairness, security, explainability, data quality, documentation; selected ISO 42001 Annex A controls; a set of MITRE ATLAS techniques relevant to LLM attacks).
- [ ] Seed script loads catalog into `Control` table.
- [ ] Mapping rules `web/lib/mapping/rules.ts`: map by finding `checkId`/domain/tags to controls (many-to-many) via declarative rules table; unit-tested; unmapped findings flagged.
- [ ] `ControlAssessment` model: assessmentId, controlId, status enum [not_assessed, compliant, partially_compliant, non_compliant, not_applicable], linkedFindingIds, evidence notes, owner, dueDate, remediationPriority (P1-P4 derived from max severity + risk tier, overridable).
- [ ] Documentation-gap check: analyse uploaded docs (keyword/section detection: intended use, data provenance, limitations, human oversight, monitoring plan, incident process) and optionally summarise with `LLMClient`; produce governance Findings (domain `governance`) for missing items.
- [ ] `POST /api/assessments/[id]/run/governance`: generates ControlAssessments from all findings so far, computes governance `domainRisk` (share of non-compliant/partial controls weighted by priority).
- [ ] Endpoints to list/update control assessments and add evidence notes.

## Acceptance criteria
- [ ] Running on the HR example maps the gender fairness finding to NIST MEASURE/MANAGE controls and the prompt-injection findings to OWASP LLM01 + an ATLAS technique.
- [ ] Mapping rules are data-driven and tested; adding a rule needs no code change in the engine.

## Prompt for coding agent
Implement the M4 backend in `web/` (TypeScript, Prisma). Read `AGENTS.md`. Create the control catalog JSON files using short, paraphrased control descriptions with accurate framework IDs (if unsure of an exact ID, use the framework's category level and add a `TODO: verify` field rather than guessing). Implement the declarative mapping engine, ControlAssessment model and run route, the documentation-gap analyzer (keyword-based, optional LLM summary via LLMClient mock mode), and priority derivation. Write Vitest tests. No UI here.
