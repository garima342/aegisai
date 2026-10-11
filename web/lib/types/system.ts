export type ModelType =
  | 'tabular_classifier'
  | 'tabular_regressor'
  | 'llm_app'
  | 'rag_system'
  | 'agent'
  | 'other';

export type RiskTier = 'minimal' | 'limited' | 'high' | 'unacceptable';

export type AssessmentStatus = 'draft' | 'intake_complete' | 'running' | 'completed';

export type ArtifactKind = 'dataset' | 'model' | 'documentation' | 'llm_config';

export interface LlmConfig {
  endpointUrl: string;
  authHeaderName?: string;
  authHeaderValue?: string; // Masked on GET
  systemPrompt: string;
  description?: string;
}

export interface Artifact {
  id: string;
  assessmentId: string;
  kind: ArtifactKind;
  filename: string;
  mime: string;
  size: number;
  storageKey: string;
  uploadedAt: string;
}

export interface Assessment {
  id: string;
  systemId: string;
  status: AssessmentStatus;
  runDataRisk: boolean;
  runSecurity: boolean;
  runGovernance: boolean;
  createdAt: string;
  updatedAt: string;
  artifacts?: Artifact[];
  overallScore?: number;
}

export interface AiSystem {
  id: string;
  name: string;
  description?: string;
  purpose: string;
  intendedUse: string;
  modelType: ModelType;
  riskTier: RiskTier;
  suggestedRiskTier?: RiskTier;
  riskRationale?: string;
  domainContext: string;
  sensitiveAttributes: string[];
  owner: string;
  llmConfig?: LlmConfig;
  createdAt: string;
  updatedAt: string;
  assessments?: Assessment[];
  artifacts?: Artifact[];
}

export interface RiskSuggestion {
  suggestedTier: RiskTier;
  rationale: string;
  regulatoryReferences: string[];
}
