import { NextRequest, NextResponse } from 'next/server';
import type { AiSystem } from '@prisma/client';

import { prisma } from '../../../../lib/prisma';
import { maskLlmConfig, updateSystemInputSchema } from '../../../../lib/m1-validation';
import { getSuggestedRiskTier } from '../../../../lib/risk-tier';

function serializeSystem(system: AiSystem) {
  return {
    ...system,
    llmConfig: maskLlmConfig(system.llmConfig),
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const system = await prisma.aiSystem.findUnique({ where: { id } });

    if (!system) {
      return NextResponse.json({ error: { message: 'System not found' } }, { status: 404 });
    }

    return NextResponse.json({ data: serializeSystem(system) });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to fetch system',
        },
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = updateSystemInputSchema.parse(await request.json());

    const existing = await prisma.aiSystem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: { message: 'System not found' } }, { status: 404 });
    }

    const shouldSuggestRiskTier =
      payload.domainContext !== undefined || payload.modelType !== undefined;

    const nextRiskTier =
      payload.riskTier ??
      (shouldSuggestRiskTier
        ? getSuggestedRiskTier({
            domainContext: payload.domainContext ?? existing.domainContext,
            modelType: payload.modelType ?? existing.modelType,
          })
        : existing.riskTier ?? null);

    const system = await prisma.aiSystem.update({
      where: { id },
      data: {
        ...payload,
        riskTier: nextRiskTier,
        llmConfig: payload.llmConfig ?? existing.llmConfig ?? undefined,
      },
    });

    return NextResponse.json({ data: serializeSystem(system) });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to update system',
        },
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.aiSystem.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true, id } });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to delete system',
        },
      },
      { status: 404 },
    );
  }
}
