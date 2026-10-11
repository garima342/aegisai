import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { Assessment } from '@/lib/types/system';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  runDataRisk: z.boolean().default(true),
  runSecurity: z.boolean().default(true),
  runGovernance: z.boolean().default(true),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const system = dbStore.systems.get(id);
    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    const assessments = Array.from(dbStore.assessments.values()).filter(
      (a) => a.systemId === id
    );

    return NextResponse.json({ data: assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve assessments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const system = dbStore.systems.get(id);
    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid assessment scope', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const assessmentId = `asmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newAssessment: Assessment = {
      id: assessmentId,
      systemId: id,
      status: 'draft',
      runDataRisk: parsed.data.runDataRisk,
      runSecurity: parsed.data.runSecurity,
      runGovernance: parsed.data.runGovernance,
      createdAt: now,
      updatedAt: now,
      artifacts: [],
    };

    dbStore.assessments.set(assessmentId, newAssessment);

    // Update system assessments list
    const systemAssessments = system.assessments || [];
    system.assessments = [newAssessment, ...systemAssessments];
    system.updatedAt = now;
    dbStore.systems.set(id, system);

    return NextResponse.json({ data: newAssessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
