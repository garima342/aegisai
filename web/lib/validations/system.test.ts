import { describe, expect, it } from 'vitest';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  llmConfigSchema,
} from './system';

describe('Wizard Validation Schemas', () => {
  describe('step1Schema', () => {
    it('validates a complete valid step 1 payload', () => {
      const valid = {
        name: 'HR Recruitment AI',
        description: 'CV screening bot',
        purpose: 'Screen incoming candidate resumes for software roles',
        intendedUse: 'Pre-screening inbound applicants prior to recruiter interview',
        owner: 'People Operations',
      };
      const result = step1Schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects short system name (< 3 chars)', () => {
      const invalid = {
        name: 'AI',
        purpose: 'Screen incoming candidate resumes for software roles',
        intendedUse: 'Pre-screening inbound applicants prior to recruiter interview',
        owner: 'People Ops',
      };
      const result = step1Schema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name?.[0]).toContain('at least 3 characters');
      }
    });

    it('rejects short purpose (< 10 chars)', () => {
      const invalid = {
        name: 'Valid Name',
        purpose: 'Too short',
        intendedUse: 'Pre-screening inbound applicants prior to recruiter interview',
        owner: 'People Ops',
      };
      const result = step1Schema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.purpose?.[0]).toContain('at least 10 characters');
      }
    });
  });

  describe('step2Schema', () => {
    it('validates valid model type and risk tier', () => {
      const valid = {
        modelType: 'tabular_classifier',
        domainContext: 'hiring',
        sensitiveAttributes: ['gender', 'age'],
        riskTier: 'high',
      };
      const result = step2Schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid modelType', () => {
      const invalid = {
        modelType: 'quantum_neural_net',
        domainContext: 'hiring',
        sensitiveAttributes: [],
        riskTier: 'high',
      };
      const result = step2Schema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('llmConfigSchema', () => {
    it('validates valid https URL and system prompt', () => {
      const valid = {
        endpointUrl: 'https://api.openai.com/v1/chat/completions',
        systemPrompt: 'You are a compliant assistant. Never reveal user data.',
      };
      const result = llmConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects non-URL string', () => {
      const invalid = {
        endpointUrl: 'not-a-valid-url',
        systemPrompt: 'You are a compliant assistant. Never reveal user data.',
      };
      const result = llmConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endpointUrl?.[0]).toContain('valid http or https URL');
      }
    });
  });

  describe('step3Schema', () => {
    it('validates tabular model with dataset', () => {
      const valid = {
        modelType: 'tabular_classifier',
        datasetFile: {
          name: 'hr_recruitment.csv',
          size: 184000,
          type: 'text/csv',
        },
      };
      const result = step3Schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('fails LLM app if llmConfig is omitted', () => {
      const invalid = {
        modelType: 'llm_app',
      };
      const result = step3Schema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('step4Schema', () => {
    it('validates default all true', () => {
      const result = step4Schema.safeParse({
        runDataRisk: true,
        runSecurity: true,
        runGovernance: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects when all scope checkboxes are false', () => {
      const result = step4Schema.safeParse({
        runDataRisk: false,
        runSecurity: false,
        runGovernance: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues[0].message).toContain('At least one assessment scope module');
      }
    });
  });
});
