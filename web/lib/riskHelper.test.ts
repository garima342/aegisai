import { describe, expect, it } from 'vitest';
import { suggestRiskTier } from './riskHelper';

describe('suggestRiskTier', () => {
  it('suggests High Risk for hiring and recruitment domain', () => {
    const result = suggestRiskTier('hiring', 'tabular_classifier');
    expect(result.suggestedTier).toBe('high');
    expect(result.rationale).toContain('EU AI Act Annex III');
  });

  it('suggests High Risk for credit and finance domain', () => {
    const result = suggestRiskTier('credit scoring', 'tabular_classifier');
    expect(result.suggestedTier).toBe('high');
  });

  it('suggests High Risk for healthcare domain', () => {
    const result = suggestRiskTier('health diagnostics', 'tabular_classifier');
    expect(result.suggestedTier).toBe('high');
  });

  it('suggests Unacceptable Risk for prohibited social scoring', () => {
    const result = suggestRiskTier('social scoring', 'tabular_classifier');
    expect(result.suggestedTier).toBe('unacceptable');
    expect(result.rationale).toContain('Article 5');
  });

  it('suggests Limited Risk for customer chatbot / LLM app', () => {
    const result = suggestRiskTier('customer support', 'llm_app');
    expect(result.suggestedTier).toBe('limited');
    expect(result.rationale).toContain('transparency');
  });

  it('suggests Minimal Risk for generic tasks like inventory', () => {
    const result = suggestRiskTier('inventory optimization', 'tabular_regressor');
    expect(result.suggestedTier).toBe('minimal');
  });
});
