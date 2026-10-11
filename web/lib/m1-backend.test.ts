import { describe, expect, it } from 'vitest';
import {
  artifactUploadSchema,
  createAssessmentInputSchema,
  createSystemInputSchema,
  maskLlmConfig,
  sanitizeFilename,
} from './m1-validation';
import { getSuggestedRiskTier } from './risk-tier';
import { validateStatusTransition } from './assessment-status';

describe('M1 validation', () => {
  it('accepts a valid system payload', () => {
    const input = {
      name: 'HR Recruitment AI',
      description: 'Applicant screening assistant',
      purpose: 'Screen candidate resumes for shortlist quality',
      intendedUse: 'Assist recruiters in initial applicant review',
      modelType: 'llm_app',
      riskTier: 'high',
      domainContext: 'hiring',
      sensitiveAttributes: ['gender', 'age'],
      owner: 'talent-ops',
      llmConfig: {
        endpointUrl: 'https://api.example.com/v1/chat',
        authHeaderName: 'Authorization',
        authHeaderValue: 'Bearer secret-token',
        systemPrompt: 'You are a recruiter assistant.',
        description: 'Used for resume triage',
      },
    };

    expect(() => createSystemInputSchema.parse(input)).not.toThrow();
  });

  it('rejects unsupported upload types', () => {
    expect(() =>
      artifactUploadSchema.parse({
        kind: 'dataset',
        file: {
          name: 'notes.xlsx',
          size: 12 * 1024,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }),
    ).toThrow();
  });

  it('rejects MIME types that only partially match an allowed type', () => {
    expect(() =>
      artifactUploadSchema.parse({
        kind: 'dataset',
        file: { name: 'data.csv', size: 1024, type: 'text/csv-malicious' },
      }),
    ).toThrow();
  });

  it('redacts LLM auth values from serialized configuration', () => {
    expect(maskLlmConfig({ authHeaderName: 'Authorization', authHeaderValue: 'Bearer secret' })).toEqual({
      authHeaderName: 'Authorization',
      authHeaderValue: '***redacted***',
    });
  });

  it('sanitizes unsafe file names', () => {
    expect(sanitizeFilename('../bad name?.csv')).toBe('bad-name-.csv');
  });
});

describe('risk tier helper', () => {
  it('flags hiring and health domains as high risk', () => {
    expect(getSuggestedRiskTier({ domainContext: 'hiring', modelType: 'llm_app' })).toBe('high');
    expect(getSuggestedRiskTier({ domainContext: 'health', modelType: 'tabular_classifier' })).toBe('high');
  });

  it('keeps lower-risk systems minimal', () => {
    expect(getSuggestedRiskTier({ domainContext: 'marketing', modelType: 'tabular_regressor' })).toBe('minimal');
  });
});

describe('status guard', () => {
  it('blocks intake_complete when data risk or security artifacts are missing', () => {
    const result = validateStatusTransition({
      currentStatus: 'draft',
      nextStatus: 'intake_complete',
      scope: {
        runDataRisk: true,
        runSecurity: true,
        runGovernance: false,
      },
      artifacts: [{ kind: 'model' }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('dataset is required for data risk assessment');
    expect(result.errors).toContain('llm_config is required for security assessment');
  });

  it('allows intake_complete when required artifacts exist', () => {
    const result = validateStatusTransition({
      currentStatus: 'draft',
      nextStatus: 'intake_complete',
      scope: {
        runDataRisk: true,
        runSecurity: true,
        runGovernance: false,
      },
      artifacts: [
        { kind: 'dataset' },
        { kind: 'llm_config' },
      ],
    });

    expect(result.ok).toBe(true);
  });
});

describe('Assessment validation', () => {
  it('requires the scope flags to be boolean and the status to be one of the enum values', () => {
    expect(() =>
      createAssessmentInputSchema.parse({
        aiSystemId: 'sys-123',
        status: 'pending',
        runDataRisk: true,
        runSecurity: true,
        runGovernance: true,
      }),
    ).toThrow();
  });
});
