import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();

    return NextResponse.json({
      data: {
        assessmentId: id,
        status: 'queued',
        model: 'data-risk',
        payload,
      },
      status: 202,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to queue data-risk analysis',
        },
      },
      { status: 400 },
    );
  }
}
