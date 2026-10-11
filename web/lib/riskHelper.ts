import { ModelType, RiskSuggestion } from './types/system';

/**
 * Suggests an EU AI Act aligned risk tier and rationale based on domain context and model type.
 */
export function suggestRiskTier(domainContext: string, modelType: ModelType): RiskSuggestion {
  const domain = (domainContext || '').toLowerCase().trim();

  // 1. Prohibited / Unacceptable Risk domains under EU AI Act Article 5
  if (
    domain.includes('social scoring') ||
    domain.includes('social_scoring') ||
    domain.includes('biometric categorization') ||
    domain.includes('subliminal manipulation') ||
    domain.includes('cognitive behavioral manipulation')
  ) {
    return {
      suggestedTier: 'unacceptable',
      rationale:
        'Social scoring, biometric categorization based on sensitive traits, and manipulative AI are categorized as Unacceptable Risk (Prohibited) under EU AI Act Article 5.',
      regulatoryReferences: ['EU AI Act Art. 5', 'Prohibited Practices'],
    };
  }

  // 2. High Risk domains under EU AI Act Annex III
  if (
    domain.includes('hiring') ||
    domain.includes('recruitment') ||
    domain.includes('employment') ||
    domain.includes('hr') ||
    domain.includes('workforce')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'Under EU AI Act Annex III (Point 4), AI systems intended for recruitment, screening, ranking candidates, or making employment decisions are classified as High-Risk.',
      regulatoryReferences: ['EU AI Act Annex III.4', 'EEOC Guidelines', 'NYC Local Law 144'],
    };
  }

  if (
    domain.includes('credit') ||
    domain.includes('finance') ||
    domain.includes('loan') ||
    domain.includes('insurance') ||
    domain.includes('underwriting')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'Under EU AI Act Annex III (Point 5b), AI systems evaluating creditworthiness or establishing credit scores are classified as High-Risk due to direct financial impact on individuals.',
      regulatoryReferences: ['EU AI Act Annex III.5b', 'FCRA', 'ECOA'],
    };
  }

  if (
    domain.includes('health') ||
    domain.includes('medical') ||
    domain.includes('clinical') ||
    domain.includes('diagnostic') ||
    domain.includes('triage')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'Medical diagnostics, patient triage, and health risk assessment systems directly affect human bodily integrity and life safety, designating them as High-Risk.',
      regulatoryReferences: ['EU AI Act Annex III.1/2', 'MDR 2017/745', 'FDA SaMD Guidance'],
    };
  }

  if (
    domain.includes('law_enforcement') ||
    domain.includes('police') ||
    domain.includes('justice') ||
    domain.includes('judiciary') ||
    domain.includes('border')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'AI deployed in law enforcement, criminal justice, or migration/border control is classified as High-Risk under EU AI Act Annex III.',
      regulatoryReferences: ['EU AI Act Annex III.6 & III.7'],
    };
  }

  if (
    domain.includes('critical_infrastructure') ||
    domain.includes('energy') ||
    domain.includes('water') ||
    domain.includes('transportation')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'Safety components in management and operation of critical digital and physical infrastructure are classified as High-Risk.',
      regulatoryReferences: ['EU AI Act Annex III.2', 'NIS2 Directive'],
    };
  }

  if (
    domain.includes('education') ||
    domain.includes('admissions') ||
    domain.includes('grading')
  ) {
    return {
      suggestedTier: 'high',
      rationale:
        'AI used to determine access, admission, or evaluation in educational and vocational training institutions is classified as High-Risk.',
      regulatoryReferences: ['EU AI Act Annex III.3'],
    };
  }

  // 3. Limited Risk (Transparency obligations)
  if (
    modelType === 'llm_app' ||
    modelType === 'rag_system' ||
    modelType === 'agent' ||
    domain.includes('customer') ||
    domain.includes('support') ||
    domain.includes('chatbot') ||
    domain.includes('assistant') ||
    domain.includes('content_generation')
  ) {
    return {
      suggestedTier: 'limited',
      rationale:
        'Interactive AI systems, chatbots, and generative LLMs carry transparency requirements under EU AI Act Article 50 (users must be informed they are interacting with AI).',
      regulatoryReferences: ['EU AI Act Art. 50', 'Transparency Obligations'],
    };
  }

  // 4. Minimal Risk
  return {
    suggestedTier: 'minimal',
    rationale:
      'General enterprise utility or analytical tasks without direct legal, financial, or discriminatory impact on natural persons represent Minimal Risk.',
    regulatoryReferences: ['EU AI Act General Application'],
  };
}
