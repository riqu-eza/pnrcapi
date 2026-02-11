import { NextResponse } from 'next/server';
import { submitPlace, validatePlace } from '@/services/placeService';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/submit - Validate only
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = params;

    const validation = await validatePlace(id);

    return NextResponse.json({ status: 'success', data: validation }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/submit error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/submit - Submit for review
export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = params;

    const place = await submitPlace(id);

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/places/:id/submit error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('Cannot submit')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}