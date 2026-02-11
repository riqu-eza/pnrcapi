import { NextResponse } from 'next/server';
import { listExhibitions, createExhibitions } from '@/services/culturalService';
import { CreateExhibitionsSchema } from '@/utils/culturalValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/exhibitions
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const exhibitions = await listExhibitions(
      id,
      isActive !== null ? isActive === 'true' : undefined
    );

    return NextResponse.json({ status: 'success', data: exhibitions }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/exhibitions error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/exhibitions
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreateExhibitionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects to match CreateExhibitionData types
    const exhibitionsPayload = parsed.data.exhibitions.map((e) => ({
      ...e,
      startDate: typeof e.startDate === 'string' ? new Date(e.startDate) : (e.startDate as any),
      endDate: typeof e.endDate === 'string' ? new Date(e.endDate) : (e.endDate as any),
    }));

    const exhibitions = await createExhibitions(id, exhibitionsPayload);

    return NextResponse.json(
      { status: 'success', data: exhibitions },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/places/:id/exhibitions error:', error);

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