import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';
import { maskLlmConfig, updateAssessmentInputSchema } from '../../../../lib/m1-validation';
import { validateStatusTransition } from '../../../../lib/assessment-status';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        aiSystem: true,
        artifacts: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: { message: 'Assessment not found' } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...assessment,
        aiSystem: {
          ...assessment.aiSystem,
          llmConfig: maskLlmConfig(assessment.aiSystem.llmConfig),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to fetch assessment',
        },
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = updateAssessmentInputSchema.parse(await request.json());
    const existing = await prisma.assessment.findUnique({
      where: { id },
      include: { artifacts: true },
    });

    if (!existing) {
      return NextResponse.json({ error: { message: 'Assessment not found' } }, { status: 404 });
    }

    const nextStatus = payload.status ?? existing.status;
    const statusCheck = validateStatusTransition({
      currentStatus: existing.status,
      nextStatus,
      scope: {
        runDataRisk: payload.runDataRisk ?? existing.runDataRisk,
        runSecurity: payload.runSecurity ?? existing.runSecurity,
        runGovernance: payload.runGovernance ?? existing.runGovernance,
      },
      artifacts: existing.artifacts,
    });

    if (!statusCheck.ok) {
      return NextResponse.json({ error: { message: statusCheck.errors.join('; ') } }, { status: 400 });
    }

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        status: nextStatus,
        runDataRisk: payload.runDataRisk,
        runSecurity: payload.runSecurity,
        runGovernance: payload.runGovernance,
      },
      include: { aiSystem: true, artifacts: true },
    });

    return NextResponse.json({
      data: {
        ...assessment,
        aiSystem: {
          ...assessment.aiSystem,
          llmConfig: maskLlmConfig(assessment.aiSystem.llmConfig),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unable to update assessment' } },
      { status: 400 },
    );
  }
}
