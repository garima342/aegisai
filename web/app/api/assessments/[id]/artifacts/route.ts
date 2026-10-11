import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { Artifact, ArtifactKind } from '@/lib/types/system';
import { LocalStorageProvider } from '@/lib/storage';

const storage = new LocalStorageProvider('./storage/uploads');

const MAX_DATASET_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

function determineKindAndValidate(filename: string, size: number): { kind: ArtifactKind; error?: string } {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  if (['.csv'].includes(ext)) {
    if (size > MAX_DATASET_SIZE) {
      return { kind: 'dataset', error: `Dataset file exceeds 25MB limit (${(size / (1024 * 1024)).toFixed(1)}MB)` };
    }
    return { kind: 'dataset' };
  }

  if (['.pkl', '.joblib', '.onnx'].includes(ext)) {
    if (size > MAX_MODEL_SIZE) {
      return { kind: 'model', error: `Model file exceeds 100MB limit (${(size / (1024 * 1024)).toFixed(1)}MB)` };
    }
    return { kind: 'model' };
  }

  if (['.pdf', '.md', '.txt'].includes(ext)) {
    if (size > MAX_DOC_SIZE) {
      return { kind: 'documentation', error: `Documentation file exceeds 10MB limit (${(size / (1024 * 1024)).toFixed(1)}MB)` };
    }
    return { kind: 'documentation' };
  }

  return {
    kind: 'documentation',
    error: `Unsupported file format '${ext}'. Allowed: .csv (dataset), .pkl/.joblib/.onnx (model), .pdf/.md/.txt (documentation)`,
  };
}

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

    const artifacts = Array.from(dbStore.artifacts.values()).filter(
      (a) => a.assessmentId === id
    );

    return NextResponse.json({ data: artifacts });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return NextResponse.json({ error: 'Failed to retrieve artifacts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const assessment = dbStore.assessments.get(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const explicitKind = formData.get('kind') as ArtifactKind | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const validation = determineKindAndValidate(file.name, file.size);
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const kind = explicitKind || validation.kind;
      const buffer = Buffer.from(await file.arrayBuffer());
      const sanitizedName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      const storagePath = await storage.uploadFile(buffer, sanitizedName);

      const artifact: Artifact = {
        id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assessmentId,
        kind,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        storageKey: storagePath,
        uploadedAt: new Date().toISOString(),
      };

      dbStore.artifacts.set(artifact.id, artifact);

      // Update assessment artifacts
      assessment.artifacts = [...(assessment.artifacts || []), artifact];
      assessment.updatedAt = new Date().toISOString();
      dbStore.assessments.set(assessmentId, assessment);

      return NextResponse.json({ data: artifact }, { status: 201 });
    }

    // Handle JSON artifact registration (metadata or mock upload)
    const jsonBody = await request.json();
    const { filename, size, mime, kind } = jsonBody;

    if (!filename || !size) {
      return NextResponse.json({ error: 'filename and size are required' }, { status: 400 });
    }

    const validation = determineKindAndValidate(filename, size);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const artifact: Artifact = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assessmentId,
      kind: kind || validation.kind,
      filename,
      mime: mime || 'application/octet-stream',
      size,
      storageKey: `mock/${filename}`,
      uploadedAt: new Date().toISOString(),
    };

    dbStore.artifacts.set(artifact.id, artifact);
    assessment.artifacts = [...(assessment.artifacts || []), artifact];
    assessment.updatedAt = new Date().toISOString();
    dbStore.assessments.set(assessmentId, assessment);

    return NextResponse.json({ data: artifact }, { status: 201 });
  } catch (error) {
    console.error('Error uploading artifact:', error);
    return NextResponse.json({ error: 'Failed to upload artifact' }, { status: 500 });
  }
}
