import { NextResponse } from 'next/server';
import { listPlaces, createDraftPlace } from '@/services/placeService';
import { createDraftPlaceSchema } from '@/utils/placeValidation';

// GET /api/places
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      cityId: searchParams.get('cityId') || undefined,
      status: searchParams.get('status') as any,
      isBookable: searchParams.get('isBookable') === 'true' ? true : undefined,
      taxonomy: searchParams.get('taxonomy')?.split(',') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice')
        ? parseFloat(searchParams.get('minPrice')!)
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? parseFloat(searchParams.get('maxPrice')!)
        : undefined,
      latitude: searchParams.get('latitude')
        ? parseFloat(searchParams.get('latitude')!)
        : undefined,
      longitude: searchParams.get('longitude')
        ? parseFloat(searchParams.get('longitude')!)
        : undefined,
      radius: searchParams.get('radius')
        ? parseFloat(searchParams.get('radius')!)
        : undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listPlaces(filters, page, limit);

    return NextResponse.json({ status: 'success', data: result }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places - Create draft place
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createDraftPlaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const place = await createDraftPlace(parsed.data);

    return NextResponse.json({ status: 'success', data: place }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/places error:', error);

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