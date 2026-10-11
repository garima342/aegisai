import { z } from 'zod';

export const step1Schema = z.object({
  name: z
    .string()
    .min(3, 'System name must be at least 3 characters')
    .max(100, 'System name cannot exceed 100 characters'),
  description: z.string().optional(),
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters to explain what the AI accomplishes'),
  intendedUse: z
    .string()
    .min(10, 'Intended use must be at least 10 characters specifying the deployment context'),
  owner: z
    .string()
    .min(2, 'Owner or responsible team name is required'),
});

export const step2Schema = z.object({
  modelType: z.enum([
    'tabular_classifier',
    'tabular_regressor',
    'llm_app',
    'rag_system',
    'agent',
    'other',
  ], {
    message: 'Please select a valid model architecture',
  }),
  domainContext: z
    .string()
    .min(2, 'Domain context is required (e.g., hiring, finance, health)'),
  sensitiveAttributes: z.array(z.string()),
  riskTier: z.enum(['minimal', 'limited', 'high', 'unacceptable'], {
    message: 'Please select a risk tier',
  }),
  suggestedRiskTier: z.enum(['minimal', 'limited', 'high', 'unacceptable']).optional(),
  riskRationale: z.string().optional(),
});

export const llmConfigSchema = z.object({
  endpointUrl: z
    .string()
    .url('Endpoint URL must be a valid http or https URL'),
  authHeaderName: z.string().optional(),
  authHeaderValue: z.string().optional(),
  systemPrompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters for prompt injection and jailbreak testing'),
  description: z.string().optional(),
});

export const step3Schema = z.object({
  modelType: z.enum([
    'tabular_classifier',
    'tabular_regressor',
    'llm_app',
    'rag_system',
    'agent',
    'other',
  ]),
  datasetFile: z
    .object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      storageKey: z.string().optional(),
    })
    .nullable()
    .optional(),
  modelFile: z
    .object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      storageKey: z.string().optional(),
    })
    .nullable()
    .optional(),
  docFiles: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        storageKey: z.string().optional(),
      })
    )
    .default([]),
  llmConfig: llmConfigSchema.optional(),
}).superRefine((data, ctx) => {
  const isLlm = data.modelType === 'llm_app' || data.modelType === 'rag_system' || data.modelType === 'agent';
  if (isLlm && !data.llmConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'LLM applications require endpoint configuration and system prompt',
      path: ['llmConfig'],
    });
  }
});

export const step4Schema = z.object({
  runDataRisk: z.boolean(),
  runSecurity: z.boolean(),
  runGovernance: z.boolean(),
}).refine(
  (data) => data.runDataRisk || data.runSecurity || data.runGovernance,
  {
    message: 'At least one assessment scope module must be enabled',
    path: ['runDataRisk'],
  }
);

export const wizardDraftSchema = step1Schema
  .merge(step2Schema)
  .merge(
    z.object({
      datasetFile: z.any().optional(),
      modelFile: z.any().optional(),
      docFiles: z.array(z.any()).default([]),
      llmConfig: llmConfigSchema.optional(),
      runDataRisk: z.boolean(),
      runSecurity: z.boolean(),
      runGovernance: z.boolean(),
    })
  );

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
export type WizardDraftData = z.infer<typeof wizardDraftSchema>;
