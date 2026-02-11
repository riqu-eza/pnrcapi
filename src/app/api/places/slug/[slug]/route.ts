import { NextResponse } from 'next/server';
import { getPlaceBySlug } from '@/services/placeService';

type Params = {
  params: {
    slug: string;
  };
};

// GET /api/places/slug/:slug
export async function GET(_: Request, { params }: Params) {
  try {
    const { slug } = params;

    const place = await getPlaceBySlug(slug);

    if (!place) {
      return NextResponse.json(
        { status: 'error', message: 'Place not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/slug/:slug error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}