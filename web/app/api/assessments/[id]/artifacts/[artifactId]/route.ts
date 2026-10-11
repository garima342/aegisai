import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { LocalStorageProvider } from '@/lib/storage';

const storage = new LocalStorageProvider('./storage/uploads');

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  try {
    const { id: assessmentId, artifactId } = await params;
    const assessment = dbStore.assessments.get(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const artifact = dbStore.artifacts.get(artifactId);
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    // Attempt to delete physical file if on disk
    if (artifact.storageKey && !artifact.storageKey.startsWith('mock/')) {
      try {
        await storage.deleteFile(artifact.storageKey);
      } catch (err) {
        console.warn('Could not delete physical file:', err);
      }
    }

    dbStore.artifacts.delete(artifactId);
    assessment.artifacts = (assessment.artifacts || []).filter((a) => a.id !== artifactId);
    assessment.updatedAt = new Date().toISOString();
    dbStore.assessments.set(assessmentId, assessment);

    return NextResponse.json({ data: { success: true, message: 'Artifact deleted' } });
  } catch (error) {
    console.error('Error deleting artifact:', error);
    return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 });
  }
}
