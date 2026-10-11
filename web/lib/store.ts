import { AiSystem, Assessment, Artifact } from './types/system';

interface SystemStore {
  systems: Map<string, AiSystem>;
  assessments: Map<string, Assessment>;
  artifacts: Map<string, Artifact>;
}

// Global in-memory singleton to persist between Next.js hot-reloads and API calls
const globalForStore = globalThis as unknown as { aegisStore?: SystemStore };

function initStore(): SystemStore {
  const store: SystemStore = {
    systems: new Map(),
    assessments: new Map(),
    artifacts: new Map(),
  };

  // Seed with "HR Recruitment AI" example system
  const hrSystemId = 'sys-hr-recruitment-01';
  const hrAssessmentId = 'asmt-hr-01';

  const hrDatasetArtifact: Artifact = {
    id: 'art-hr-ds-01',
    assessmentId: hrAssessmentId,
    kind: 'dataset',
    filename: 'hr_recruitment.csv',
    mime: 'text/csv',
    size: 184320,
    storageKey: 'datasets/hr_recruitment.csv',
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  };

  const hrModelArtifact: Artifact = {
    id: 'art-hr-mdl-01',
    assessmentId: hrAssessmentId,
    kind: 'model',
    filename: 'hr_model.joblib',
    mime: 'application/octet-stream',
    size: 512000,
    storageKey: 'models/hr_model.joblib',
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  };

  const hrDocArtifact: Artifact = {
    id: 'art-hr-doc-01',
    assessmentId: hrAssessmentId,
    kind: 'documentation',
    filename: 'recruitment_model_card_v1.pdf',
    mime: 'application/pdf',
    size: 1420000,
    storageKey: 'docs/recruitment_model_card_v1.pdf',
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  };

  const hrAssessment: Assessment = {
    id: hrAssessmentId,
    systemId: hrSystemId,
    status: 'intake_complete',
    runDataRisk: true,
    runSecurity: true,
    runGovernance: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    artifacts: [hrDatasetArtifact, hrModelArtifact, hrDocArtifact],
  };

  const hrSystem: AiSystem = {
    id: hrSystemId,
    name: 'HR Recruitment AI',
    description: 'Automated resume screening and candidate ranking system evaluating prospective software engineering applicants.',
    purpose: 'Screen incoming candidate CVs against job specifications and predict hiring probability.',
    intendedUse: 'Pre-screening inbound applicants to assist human recruiters in shortlisting.',
    modelType: 'tabular_classifier',
    riskTier: 'high',
    suggestedRiskTier: 'high',
    riskRationale: 'Under EU AI Act Annex III (Point 4), AI systems intended for recruitment, screening, ranking candidates, or making employment decisions are classified as High-Risk.',
    domainContext: 'hiring',
    sensitiveAttributes: ['gender', 'age', 'race'],
    owner: 'People Operations & AI Team',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    assessments: [hrAssessment],
    artifacts: [hrDatasetArtifact, hrModelArtifact, hrDocArtifact],
  };

  store.systems.set(hrSystem.id, hrSystem);
  store.assessments.set(hrAssessment.id, hrAssessment);
  store.artifacts.set(hrDatasetArtifact.id, hrDatasetArtifact);
  store.artifacts.set(hrModelArtifact.id, hrModelArtifact);
  store.artifacts.set(hrDocArtifact.id, hrDocArtifact);

  // Add another system for realistic list view testing
  const customerBotId = 'sys-cs-assistant-02';
  const customerBot: AiSystem = {
    id: customerBotId,
    name: 'Aegis Customer Support Assistant',
    description: 'Conversational LLM helping customers navigate account features and resolve common billing queries.',
    purpose: 'Answer customer FAQ inquiries and triage tickets to human agents.',
    intendedUse: 'Public-facing customer support chat widget.',
    modelType: 'llm_app',
    riskTier: 'limited',
    suggestedRiskTier: 'limited',
    riskRationale: 'Customer-facing conversational bots require transparency notice under EU AI Act Article 50.',
    domainContext: 'customer_service',
    sensitiveAttributes: [],
    owner: 'Customer Experience Engineering',
    llmConfig: {
      endpointUrl: 'https://api.internal.company.com/v1/support-chat',
      systemPrompt: 'You are a polite, helpful customer service agent. Do not reveal internal API tokens or execute code.',
      description: 'Support bot agent endpoint with rate limiting',
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    assessments: [],
    artifacts: [],
  };
  store.systems.set(customerBot.id, customerBot);

  return store;
}

export const dbStore = globalForStore.aegisStore ?? initStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.aegisStore = dbStore;
}
