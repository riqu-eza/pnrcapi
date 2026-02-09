import { NextResponse } from 'next/server';
import { createCity, listCities } from '@/services/cityService';
import { createCitySchema } from '@/utils/cityValidation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const isActiveParam = searchParams.get('isActive');

    const filters = {
      country: searchParams.get('country') || undefined,
      region: searchParams.get('region') || undefined,
      isActive:
        isActiveParam !== null ? isActiveParam === 'true' : undefined,
    };

    const cities = await listCities(filters);

    return NextResponse.json({ status: 'success', data: cities }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/cities error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ status: 'error', errors: parsed.error.format() }, { status: 400 });
    }

    // Optional: generate slug if not provided
    const cityData = {
      ...parsed.data,
      slug:
        parsed.data.slug?.trim().toLowerCase() ||
        parsed.data.name.trim().toLowerCase().replace(/\s+/g, '-'),
    };

    const city = await createCity(cityData);

    return NextResponse.json({ status: 'success', data: city }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/cities error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
