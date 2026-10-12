import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../../../lib/prisma';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; artifactId: string }> }) {
  try {
    const { artifactId } = await params;
    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      return NextResponse.json({ error: { message: 'Artifact not found' } }, { status: 404 });
    }

    return NextResponse.json({ data: artifact });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to fetch artifact',
        },
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; artifactId: string }> }) {
  try {
    const { artifactId } = await params;
    const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });

    if (!artifact) {
      return NextResponse.json({ error: { message: 'Artifact not found' } }, { status: 404 });
    }

    await prisma.artifact.delete({ where: { id: artifactId } });

    return NextResponse.json({ data: { deleted: true, id: artifactId } });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to delete artifact',
        },
      },
      { status: 400 },
    );
  }
}
