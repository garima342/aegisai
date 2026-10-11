import { NextRequest, NextResponse } from 'next/server';
import { suggestRiskTier } from '@/lib/riskHelper';
import { ModelType } from '@/lib/types/system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domainContext = body.domainContext || '';
    const modelType = (body.modelType || 'other') as ModelType;

    const suggestion = suggestRiskTier(domainContext, modelType);

    return NextResponse.json({
      data: suggestion,
    });
  } catch (error) {
    console.error('Error suggesting risk tier:', error);
    return NextResponse.json(
      { error: 'Failed to compute risk suggestion' },
      { status: 500 }
    );
  }
}
