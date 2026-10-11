import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/store';
import { AiSystem, Assessment, Artifact } from '@/lib/types/system';
import { suggestRiskTier } from '@/lib/riskHelper';
import { maskLlmConfig } from '@/lib/m1-validation';
import { z } from 'zod';

const createSystemApiSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  purpose: z.string().min(10),
  intendedUse: z.string().min(10),
  modelType: z.string(),
  domainContext: z.string().min(2),
  sensitiveAttributes: z.array(z.string()).default([]),
  riskTier: z.string().optional(),
  owner: z.string().min(2),
  llmConfig: z
    .object({
      endpointUrl: z.string().url(),
      authHeaderName: z.string().optional(),
      authHeaderValue: z.string().optional(),
      systemPrompt: z.string().min(10),
      description: z.string().optional(),
    })
    .optional(),
  assessmentScope: z
    .object({
      runDataRisk: z.boolean().default(true),
      runSecurity: z.boolean().default(true),
      runGovernance: z.boolean().default(true),
    })
    .optional(),
  artifacts: z
    .array(
      z.object({
        kind: z.string(),
        filename: z.string(),
        mime: z.string(),
        size: z.number(),
        storageKey: z.string().optional(),
      })
    )
    .optional(),
});

function sanitizeSystem(system: any) {
  return {
    ...system,
    llmConfig: system.llmConfig ? maskLlmConfig(system.llmConfig) : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const riskTier = searchParams.get('riskTier') || '';
    const modelType = searchParams.get('modelType') || '';

    // Attempt Prisma first
    try {
      const dbSystems = await prisma.aiSystem.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (dbSystems && dbSystems.length > 0) {
        let list = dbSystems as any[];
        if (search) {
          list = list.filter(
            (s) =>
              s.name.toLowerCase().includes(search) ||
              s.description?.toLowerCase().includes(search) ||
              s.domainContext.toLowerCase().includes(search) ||
              s.owner.toLowerCase().includes(search)
          );
        }
        if (riskTier && riskTier !== 'all') {
          list = list.filter((s) => s.riskTier === riskTier);
        }
        if (modelType && modelType !== 'all') {
          list = list.filter((s) => s.modelType === modelType);
        }
        return NextResponse.json({ data: list.map(sanitizeSystem) });
      }
    } catch {
      // Fallback to in-memory store
    }

    let list = Array.from(dbStore.systems.values());
    if (search) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search) ||
          s.domainContext.toLowerCase().includes(search) ||
          s.owner.toLowerCase().includes(search)
      );
    }
    if (riskTier && riskTier !== 'all') {
      list = list.filter((s) => s.riskTier === riskTier);
    }
    if (modelType && modelType !== 'all') {
      list = list.filter((s) => s.modelType === modelType);
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      data: list.map(sanitizeSystem),
    });
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI systems' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSystemApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const systemId = `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const suggestion = suggestRiskTier(data.domainContext, data.modelType);
    const riskTier = data.riskTier || suggestion.suggestedTier;

    // Attempt Prisma persistence
    try {
      const createdDbSystem = await prisma.aiSystem.create({
        data: {
          name: data.name,
          description: data.description || '',
          purpose: data.purpose,
          intendedUse: data.intendedUse,
          modelType: data.modelType,
          domainContext: data.domainContext,
          sensitiveAttributes: data.sensitiveAttributes,
          riskTier,
          owner: data.owner,
          llmConfig: data.llmConfig ? (data.llmConfig as any) : undefined,
        },
      });
      return NextResponse.json(
        { data: sanitizeSystem(createdDbSystem) },
        { status: 201 }
      );
    } catch {
      // Fallback to in-memory store
    }

    const newSystem: AiSystem = {
      id: systemId,
      name: data.name,
      description: data.description,
      purpose: data.purpose,
      intendedUse: data.intendedUse,
      modelType: data.modelType,
      domainContext: data.domainContext,
      sensitiveAttributes: data.sensitiveAttributes,
      riskTier,
      suggestedRiskTier: suggestion.suggestedTier,
      riskRationale: suggestion.rationale,
      owner: data.owner,
      llmConfig: data.llmConfig,
      createdAt: now,
      updatedAt: now,
      assessments: [],
      artifacts: [],
    };

    if (data.assessmentScope) {
      const assessmentId = `asmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const assessmentArtifacts: Artifact[] = [];

      if (data.artifacts && data.artifacts.length > 0) {
        data.artifacts.forEach((art, index) => {
          const artifactRecord: Artifact = {
            id: `art-${Date.now()}-${index}`,
            assessmentId,
            kind: art.kind as any,
            filename: art.filename,
            mime: art.mime,
            size: art.size,
            storageKey: art.storageKey || `uploads/${art.filename}`,
            uploadedAt: now,
          };
          dbStore.artifacts.set(artifactRecord.id, artifactRecord);
          assessmentArtifacts.push(artifactRecord);
        });
      }

      const initialAssessment: Assessment = {
        id: assessmentId,
        systemId,
        status: assessmentArtifacts.length > 0 ? 'intake_complete' : 'draft',
        runDataRisk: data.assessmentScope.runDataRisk,
        runSecurity: data.assessmentScope.runSecurity,
        runGovernance: data.assessmentScope.runGovernance,
        createdAt: now,
        updatedAt: now,
        artifacts: assessmentArtifacts,
      };

      dbStore.assessments.set(assessmentId, initialAssessment);
      newSystem.assessments = [initialAssessment];
      newSystem.artifacts = assessmentArtifacts;
    }

    dbStore.systems.set(systemId, newSystem);

    return NextResponse.json(
      { data: sanitizeSystem(newSystem) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AI system:', error);
    return NextResponse.json(
      { error: 'Internal server error creating AI system' },
      { status: 500 }
    );
  }
}
