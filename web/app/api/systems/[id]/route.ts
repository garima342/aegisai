import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { AiSystem } from '@/lib/types/system';

function sanitizeSystem(system: AiSystem): AiSystem {
  if (system.llmConfig?.authHeaderValue) {
    return {
      ...system,
      llmConfig: {
        ...system.llmConfig,
        authHeaderValue: '********',
      },
    };
  }
  return system;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const system = dbStore.systems.get(id);

    if (!system) {
      return NextResponse.json(
        { error: 'AI System not found' },
        { status: 404 }
      );
    }

    // Attach latest assessments and artifacts from store
    const assessments = Array.from(dbStore.assessments.values()).filter(
      (a) => a.systemId === id
    );
    const artifacts = assessments.flatMap((a) => a.artifacts || []);

    const fullSystem: AiSystem = {
      ...system,
      assessments,
      artifacts,
    };

    return NextResponse.json({
      data: sanitizeSystem(fullSystem),
    });
  } catch (error) {
    console.error('Error fetching system:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI System' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = dbStore.systems.get(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'AI System not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    const updated: AiSystem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable
      updatedAt: new Date().toISOString(),
    };

    dbStore.systems.set(id, updated);

    return NextResponse.json({
      data: sanitizeSystem(updated),
    });
  } catch (error) {
    console.error('Error updating system:', error);
    return NextResponse.json(
      { error: 'Failed to update AI System' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!dbStore.systems.has(id)) {
      return NextResponse.json(
        { error: 'AI System not found' },
        { status: 404 }
      );
    }

    // Remove system and associated assessments/artifacts
    dbStore.systems.delete(id);
    const assessments = Array.from(dbStore.assessments.values()).filter(
      (a) => a.systemId === id
    );
    for (const a of assessments) {
      dbStore.assessments.delete(a.id);
      if (a.artifacts) {
        for (const art of a.artifacts) {
          dbStore.artifacts.delete(art.id);
        }
      }
    }

    return NextResponse.json({
      data: { success: true, message: 'System deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting system:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI System' },
      { status: 500 }
    );
  }
}
