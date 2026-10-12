import { NextRequest, NextResponse } from 'next/server';

import { getSuggestedRiskTier } from '../../../../lib/risk-tier';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const domainContext = typeof payload.domainContext === 'string' ? payload.domainContext : '';
    const modelType = typeof payload.modelType === 'string' ? payload.modelType : 'tabular_classifier';

    return NextResponse.json({
      data: getSuggestedRiskTier({
        domainContext,
        modelType,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unable to suggest risk tier',
        },
      },
      { status: 400 },
    );
  }
}
