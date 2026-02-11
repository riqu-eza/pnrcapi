import { NextResponse } from 'next/server';
import { listPerformances, createPerformances } from '@/services/entertainmentService';
import { CreatePerformancesSchema } from '@/utils/entertainmentValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/performances
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const filters = {
      showId: searchParams.get('showId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
      availableOnly: searchParams.get('availableOnly') === 'true',
    };

    const performances = await listPerformances(id, filters);

    return NextResponse.json({ status: 'success', data: performances }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/performances error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/performances
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreatePerformancesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const performancesData = parsed.data.performances.map((p) => ({
      ...p,
      startDateTime: new Date(p.startDateTime),
      endDateTime: new Date(p.endDateTime),
    }));

    const performances = await createPerformances(id, performancesData);

    return NextResponse.json(
      { status: 'success', data: performances },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/places/:id/performances error:', error);

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