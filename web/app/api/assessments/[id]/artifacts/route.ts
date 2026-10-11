import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';

import { prisma } from '../../../../../lib/prisma';
import { artifactUploadSchema, sanitizeFilename } from '../../../../../lib/m1-validation';
import { LocalStorageProvider } from '../../../../../lib/storage';

const storage = new LocalStorageProvider(path.join(process.cwd(), 'storage'));

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artifacts = await prisma.artifact.findMany({
      where: { assessmentId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ data: artifacts });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to list artifacts',
        },
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: { message: 'Assessment not found' } }, { status: 404 });
    }

    const formData = await request.formData();
    const rawKind = String(formData.get('kind') ?? '');
    const rawFile = formData.get('file');

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: { message: 'A file upload is required' } }, { status: 400 });
    }

    const payload = artifactUploadSchema.parse({
      kind: rawKind,
      file: {
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type || 'application/octet-stream',
      },
    });

    const buffer = Buffer.from(await rawFile.arrayBuffer());
    const filename = sanitizeFilename(payload.file.name);
    const storageKey = await storage.uploadFile(buffer, filename);

    const artifact = await prisma.artifact.create({
      data: {
        assessmentId: id,
        kind: payload.kind,
        filename,
        mime: payload.file.type || 'application/octet-stream',
        size: payload.file.size,
        storageKey,
      },
    });

    return NextResponse.json({ data: artifact }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to upload artifact',
        },
      },
      { status: 400 },
    );
  }
}
