import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = dbStore.assessments.get(id);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const system = dbStore.systems.get(assessment.systemId);
    const artifacts = Array.from(dbStore.artifacts.values()).filter(
      (a) => a.assessmentId === id
    );

    return NextResponse.json({
      data: {
        ...assessment,
        system,
        artifacts,
      },
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ error: 'Failed to retrieve assessment' }, { status: 500 });
  }
}
