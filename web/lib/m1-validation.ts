import { z } from 'zod';

export const modelTypeEnum = z.enum([
  'tabular_classifier',
  'tabular_regressor',
  'llm_app',
  'rag_system',
  'agent',
  'other',
]);

export const riskTierEnum = z.enum(['minimal', 'limited', 'high', 'unacceptable']);
export const assessmentStatusEnum = z.enum(['draft', 'intake_complete', 'running', 'completed']);
export const artifactKindEnum = z.enum(['dataset', 'model', 'documentation', 'llm_config']);

export const llmConfigSchema = z.object({
  endpointUrl: z.string().url('endpointUrl must be a valid URL'),
  authHeaderName: z.string().min(1, 'authHeaderName is required'),
  authHeaderValue: z.string().min(1, 'authHeaderValue is required'),
  systemPrompt: z.string().min(1, 'systemPrompt is required'),
  description: z.string().min(1, 'description is required'),
});

export const systemBaseSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  purpose: z.string().trim().min(1, 'purpose is required'),
  intendedUse: z.string().trim().min(1, 'intendedUse is required'),
  modelType: modelTypeEnum,
  riskTier: riskTierEnum.optional(),
  domainContext: z.string().trim().min(1, 'domainContext is required'),
  sensitiveAttributes: z.array(z.string().trim().min(1)).default([]),
  owner: z.string().trim().min(1, 'owner is required'),
  llmConfig: llmConfigSchema.optional(),
});

export const createSystemInputSchema = systemBaseSchema.superRefine((value, ctx) => {
  if (value.modelType === 'llm_app' && !value.llmConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['llmConfig'],
      message: 'llmConfig is required for llm_app systems',
    });
  }
});

export const updateSystemInputSchema = systemBaseSchema.partial();

export const createAssessmentInputSchema = z.object({
  aiSystemId: z.string().trim().min(1, 'aiSystemId is required'),
  status: assessmentStatusEnum.default('draft'),
  runDataRisk: z.boolean().default(false),
  runSecurity: z.boolean().default(false),
  runGovernance: z.boolean().default(false),
});

export const updateAssessmentInputSchema = createAssessmentInputSchema.partial().extend({
  id: z.string().optional(),
});

export const artifactUploadSchema = z
  .object({
    kind: artifactKindEnum,
    file: z.object({
      name: z.string().trim().min(1, 'file name is required'),
      size: z.number().int().positive('file size must be positive'),
      type: z.string().optional().default('application/octet-stream'),
    }),
  })
  .superRefine((value, ctx) => {
    const fileName = value.file.name.toLowerCase();
    const mime = value.file.type.toLowerCase();

    const rules: Record<string, { ext: string[]; mime: string[]; maxBytes: number }> = {
      dataset: {
        ext: ['csv'],
        mime: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
        maxBytes: 25 * 1024 * 1024,
      },
      model: {
        ext: ['pkl', 'joblib', 'onnx'],
        mime: ['application/octet-stream', 'application/x-pickle', 'application/onnx', 'application/vnd.onnx'],
        maxBytes: 100 * 1024 * 1024,
      },
      documentation: {
        ext: ['pdf', 'md', 'txt'],
        mime: ['application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown'],
        maxBytes: 10 * 1024 * 1024,
      },
      llm_config: {
        ext: ['json', 'yaml', 'yml', 'txt'],
        mime: ['application/json', 'text/plain', 'application/yaml', 'application/x-yaml'],
        maxBytes: 5 * 1024 * 1024,
      },
    };

    const rule = rules[value.kind];
    const extension = fileName.split('.').pop() ?? '';

    if (!rule.ext.includes(extension)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['file', 'name'],
        message: `${value.kind} uploads must use one of: ${rule.ext.join(', ')}`,
      });
    }

    const matchesMime = rule.mime.includes(mime);
    const allowsGenericBinaryMime = value.kind === 'model' && mime === 'application/octet-stream';
    if (!matchesMime && !allowsGenericBinaryMime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['file', 'type'],
        message: `Unsupported MIME type for ${value.kind}: ${mime}`,
      });
    }

    if (value.file.size > rule.maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['file', 'size'],
        message: `${value.kind} files must be <= ${rule.maxBytes} bytes`,
      });
    }
  });

export function sanitizeFilename(rawName: string): string {
  const base = (rawName || 'uploaded-file').replace(/\\/g, '/');
  const fileName = base.split('/').pop() ?? 'uploaded-file';
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\s+/g, '-');

  return cleaned || 'uploaded-file';
}

export function maskLlmConfig(config: unknown) {
  if (!config || typeof config !== 'object') return null;

  const cfg = { ...config } as Record<string, unknown>;
  if (typeof cfg.authHeaderValue === 'string') {
    cfg.authHeaderValue = '***redacted***';
  }
  return cfg;
}
