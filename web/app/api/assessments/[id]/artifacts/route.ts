import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/store';
import { Artifact, ArtifactKind } from '@/lib/types/system';
import { LocalStorageProvider } from '@/lib/storage';
import { artifactUploadSchema, sanitizeFilename } from '@/lib/m1-validation';

const storage = new LocalStorageProvider(path.join(process.cwd(), 'storage'));

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    try {
      const artifacts = await prisma.artifact.findMany({
        where: { assessmentId: id },
        orderBy: { uploadedAt: 'desc' },
      });
      if (artifacts && artifacts.length > 0) {
        return NextResponse.json({ data: artifacts });
      }
    } catch {
      // Fallback
    }

    const assessment = dbStore.assessments.get(id);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const artifacts = Array.from(dbStore.artifacts.values()).filter(
      (a) => a.assessmentId === id
    );

    return NextResponse.json({ data: artifacts });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unable to list artifacts' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assessmentId } = await params;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawKind = String(formData.get('kind') ?? 'documentation');
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

      try {
        const assessment = await prisma.assessment.findUnique({
          where: { id: assessmentId },
          select: { id: true },
        });

        if (assessment) {
          const artifact = await prisma.artifact.create({
            data: {
              assessmentId,
              kind: payload.kind,
              filename,
              mime: payload.file.type || 'application/octet-stream',
              size: payload.file.size,
              storageKey,
            },
          });
          return NextResponse.json({ data: artifact }, { status: 201 });
        }
      } catch {
        // Fallback
      }

      const artifact: Artifact = {
        id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assessmentId,
        kind: payload.kind as ArtifactKind,
        filename,
        mime: payload.file.type || 'application/octet-stream',
        size: payload.file.size,
        storageKey,
        uploadedAt: new Date().toISOString(),
      };

      dbStore.artifacts.set(artifact.id, artifact);
      const memAssessment = dbStore.assessments.get(assessmentId);
      if (memAssessment) {
        memAssessment.artifacts = [...(memAssessment.artifacts || []), artifact];
        memAssessment.updatedAt = new Date().toISOString();
        dbStore.assessments.set(assessmentId, memAssessment);
      }

      return NextResponse.json({ data: artifact }, { status: 201 });
    }

    // JSON upload
    const jsonBody = await request.json();
    const { filename, size, mime, kind } = jsonBody;

    if (!filename || !size) {
      return NextResponse.json({ error: { message: 'filename and size are required' } }, { status: 400 });
    }

    const artifact: Artifact = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assessmentId,
      kind: (kind || 'documentation') as ArtifactKind,
      filename,
      mime: mime || 'application/octet-stream',
      size,
      storageKey: `uploads/${filename}`,
      uploadedAt: new Date().toISOString(),
    };

    dbStore.artifacts.set(artifact.id, artifact);
    return NextResponse.json({ data: artifact }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unable to upload artifact' } },
      { status: 400 }
    );
  }
}
