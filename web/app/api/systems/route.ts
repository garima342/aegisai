import { NextRequest, NextResponse } from 'next/server';
import type { AiSystem } from '@prisma/client';

import { prisma } from '../../../lib/prisma';
import { createSystemInputSchema, maskLlmConfig } from '../../../lib/m1-validation';
import { getSuggestedRiskTier } from '../../../lib/risk-tier';

function serializeSystem(system: AiSystem) {
  return {
    ...system,
    llmConfig: maskLlmConfig(system.llmConfig),
  };
}

export async function GET() {
  const systems = await prisma.aiSystem.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: systems.map(serializeSystem) });
}

export async function POST(request: NextRequest) {
  try {
    const payload = createSystemInputSchema.parse(await request.json());
    const riskTier = payload.riskTier ?? getSuggestedRiskTier({
      domainContext: payload.domainContext,
      modelType: payload.modelType,
    });

    const system = await prisma.aiSystem.create({
      data: {
        ...payload,
        riskTier,
        llmConfig: payload.llmConfig ?? undefined,
      },
    });

    return NextResponse.json({ data: serializeSystem(system) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Invalid system payload',
        },
      },
      { status: 400 },
    );
  }
}
