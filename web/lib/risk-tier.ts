export type RiskTier = 'minimal' | 'limited' | 'high' | 'unacceptable';

export function getSuggestedRiskTier({
  domainContext,
  modelType,
}: {
  domainContext: string;
  modelType: string;
}): RiskTier {
  const normalizedDomain = domainContext.toLowerCase();
  const highRiskDomains = new Set([
    'hiring',
    'finance',
    'credit',
    'health',
    'medical',
    'insurance',
    'employment',
    'housing',
  ]);

  const highRiskModels = new Set(['llm_app', 'rag_system', 'agent']);

  if (highRiskDomains.has(normalizedDomain) || highRiskModels.has(modelType)) {
    return 'high';
  }

  if (normalizedDomain.includes('education')) {
    return 'limited';
  }

  return 'minimal';
}
