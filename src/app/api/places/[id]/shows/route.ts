import { NextResponse } from 'next/server';
import { listShows, createShows } from '@/services/entertainmentService';
import { CreateShowsSchema } from '@/utils/entertainmentValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/shows
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const shows = await listShows(
      id,
      isActive !== null ? isActive === 'true' : undefined
    );

    return NextResponse.json({ status: 'success', data: shows }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/shows error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/shows
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreateShowsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const shows = await createShows(id, parsed.data.shows);

    return NextResponse.json({ status: 'success', data: shows }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/places/:id/shows error:', error);

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