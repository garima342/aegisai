import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';

import { prisma } from '../../../../lib/prisma';
import { LocalStorageProvider } from '../../../../lib/storage';

const storage = new LocalStorageProvider(path.join(process.cwd(), 'storage'));

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artifact = await prisma.artifact.findUnique({ where: { id } });

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

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artifact = await prisma.artifact.findUnique({ where: { id } });

    if (!artifact) {
      return NextResponse.json({ error: { message: 'Artifact not found' } }, { status: 404 });
    }

    await storage.deleteFile(artifact.storageKey);
    await prisma.artifact.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true, id } });
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
