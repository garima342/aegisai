import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../../lib/prisma';
import { createAssessmentInputSchema } from '../../../../../lib/m1-validation';
import { validateStatusTransition } from '../../../../../lib/assessment-status';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = createAssessmentInputSchema.parse(await request.json());

    const system = await prisma.aiSystem.findUnique({ where: { id } });
    if (!system) {
      return NextResponse.json({ error: { message: 'System not found' } }, { status: 404 });
    }

    if (payload.aiSystemId !== id) {
      return NextResponse.json({ error: { message: 'aiSystemId must match the system in the URL' } }, { status: 400 });
    }

    if (payload.status === 'intake_complete') {
      const statusCheck = validateStatusTransition({
        currentStatus: 'draft',
        nextStatus: payload.status,
        scope: {
          runDataRisk: payload.runDataRisk,
          runSecurity: payload.runSecurity,
          runGovernance: payload.runGovernance,
        },
        artifacts: [],
      });

      if (!statusCheck.ok) {
        return NextResponse.json({ error: { message: statusCheck.errors.join('; ') } }, { status: 400 });
      }
    }

    const assessment = await prisma.assessment.create({
      data: {
        aiSystemId: id,
        status: payload.status,
        runDataRisk: payload.runDataRisk,
        runSecurity: payload.runSecurity,
        runGovernance: payload.runGovernance,
      },
    });

    return NextResponse.json({ data: assessment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to create assessment',
        },
      },
      { status: 400 },
    );
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const assessments = await prisma.assessment.findMany({
      where: { aiSystemId: id },
      orderBy: { createdAt: 'desc' },
      include: { artifacts: true },
    });

    return NextResponse.json({ data: assessments });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to list assessments',
        },
      },
      { status: 400 },
    );
  }
}
