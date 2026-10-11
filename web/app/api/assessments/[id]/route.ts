import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/store';
import { maskLlmConfig } from '@/lib/m1-validation';
import { validateStatusTransition } from '@/lib/assessment-status';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          aiSystem: true,
          artifacts: true,
        },
      });

      if (assessment) {
        return NextResponse.json({
          data: {
            ...assessment,
            aiSystem: {
              ...assessment.aiSystem,
              llmConfig: maskLlmConfig(assessment.aiSystem.llmConfig),
            },
          },
        });
      }
    } catch {
      // Fallback
    }

    const memAssessment = dbStore.assessments.get(id);
    if (!memAssessment) {
      return NextResponse.json({ error: { message: 'Assessment not found' } }, { status: 404 });
    }

    const system = dbStore.systems.get(memAssessment.systemId);
    const artifacts = Array.from(dbStore.artifacts.values()).filter((a) => a.assessmentId === id);

    return NextResponse.json({
      data: {
        ...memAssessment,
        system,
        aiSystem: system,
        artifacts,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to fetch assessment',
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
      const existing = await prisma.assessment.findUnique({
        where: { id },
        include: { artifacts: true },
      });

      if (existing) {
        const nextStatus = body.status ?? existing.status;
        const statusCheck = validateStatusTransition({
          currentStatus: existing.status as any,
          nextStatus: nextStatus as any,
          scope: {
            runDataRisk: body.runDataRisk ?? existing.runDataRisk,
            runSecurity: body.runSecurity ?? existing.runSecurity,
            runGovernance: body.runGovernance ?? existing.runGovernance,
          },
          artifacts: existing.artifacts as any,
        });

        if (!statusCheck.ok) {
          return NextResponse.json(
            { error: { message: statusCheck.errors.join('; ') } },
            { status: 400 }
          );
        }

        const updated = await prisma.assessment.update({
          where: { id },
          data: body,
          include: { artifacts: true },
        });

        return NextResponse.json({ data: updated });
      }
    } catch {
      // Fallback
    }

    const memAssessment = dbStore.assessments.get(id);
    if (!memAssessment) {
      return NextResponse.json({ error: { message: 'Assessment not found' } }, { status: 404 });
    }

    const updated = {
      ...memAssessment,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    dbStore.assessments.set(id, updated);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to update assessment',
        },
      },
      { status: 400 }
    );
  }
}
