import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/store';
import { maskLlmConfig } from '@/lib/m1-validation';
import { getSuggestedRiskTier } from '@/lib/risk-tier';

function serializeSystem(system: any) {
  return {
    ...system,
    llmConfig: system.llmConfig ? maskLlmConfig(system.llmConfig) : undefined,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    try {
      const system = await prisma.aiSystem.findUnique({
        where: { id },
        include: {
          assessments: {
            include: {
              artifacts: true,
            },
          },
        },
      });

      if (system) {
        return NextResponse.json({ data: serializeSystem(system) });
      }
    } catch {
      // Fallback to in-memory store
    }

    const memSystem = dbStore.systems.get(id);
    if (!memSystem) {
      return NextResponse.json({ error: { message: 'System not found' } }, { status: 404 });
    }

    const assessments = Array.from(dbStore.assessments.values()).filter((a) => a.systemId === id);
    const artifacts = assessments.flatMap((a) => a.artifacts || []);

    return NextResponse.json({
      data: serializeSystem({
        ...memSystem,
        assessments,
        artifacts,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to fetch system',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      const existing = await prisma.aiSystem.findUnique({ where: { id } });
      if (existing) {
        const nextRiskTier =
          body.riskTier ??
          (body.domainContext || body.modelType
            ? getSuggestedRiskTier({
                domainContext: body.domainContext ?? existing.domainContext,
                modelType: body.modelType ?? existing.modelType,
              })
            : existing.riskTier);

        const updated = await prisma.aiSystem.update({
          where: { id },
          data: {
            ...body,
            riskTier: nextRiskTier,
          },
        });
        return NextResponse.json({ data: serializeSystem(updated) });
      }
    } catch {
      // Fallback to in-memory store
    }

    const memSystem = dbStore.systems.get(id);
    if (!memSystem) {
      return NextResponse.json({ error: { message: 'System not found' } }, { status: 404 });
    }

    const updated = {
      ...memSystem,
      ...body,
      id: memSystem.id,
      updatedAt: new Date().toISOString(),
    };
    dbStore.systems.set(id, updated);

    return NextResponse.json({ data: serializeSystem(updated) });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to update system',
        },
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    try {
      await prisma.aiSystem.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      // Fallback
    }

    dbStore.systems.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete system',
        },
      },
      { status: 500 }
    );
  }
}
