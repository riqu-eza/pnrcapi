import { NextResponse } from 'next/server';
import { listArtifacts, createArtifacts } from '@/services/culturalService';
import { CreateArtifactsSchema } from '@/utils/culturalValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/artifacts
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const filters = {
      exhibitionId: searchParams.get('exhibitionId') || undefined,
      category: searchParams.get('category') || undefined,
      isOnDisplay: searchParams.get('isOnDisplay') === 'true' ? true : undefined,
    };

    const artifacts = await listArtifacts(id, filters);

    return NextResponse.json({ status: 'success', data: artifacts }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/artifacts error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/artifacts
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreateArtifactsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Convert acquisitionDate strings to Date objects to satisfy CreateArtifactData type
    const artifactsInput = [];
    for (const a of parsed.data.artifacts) {
      let acquisitionDate: Date | undefined = undefined;
      if (a.acquisitionDate) {
        acquisitionDate = new Date(a.acquisitionDate);
        if (isNaN(acquisitionDate.getTime())) {
          return NextResponse.json(
            { status: 'error', message: `Invalid acquisitionDate for artifact "${a.name}"` },
            { status: 400 }
          );
        }
      }
      artifactsInput.push({ ...a, acquisitionDate });
    }

    const artifacts = await createArtifacts(id, artifactsInput);

    return NextResponse.json({ status: 'success', data: artifacts }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/places/:id/artifacts error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}