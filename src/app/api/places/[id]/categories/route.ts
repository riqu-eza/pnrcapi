import { NextResponse } from 'next/server';
import { linkPlaceToCategories } from '@/services/placeService';
import { linkPlaceToCategoriesSchema } from '@/utils/placeValidation';

type Params = {
  params: {
    id: string;
  };
};

// PUT /api/places/:id/categories
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = linkPlaceToCategoriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const place = await linkPlaceToCategories(id, parsed.data.categoryIds);

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/places/:id/categories error:', error);

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