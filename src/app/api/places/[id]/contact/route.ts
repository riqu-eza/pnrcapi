import { NextResponse } from 'next/server';
import { updatePlaceContact } from '@/services/placeService';
import { updatePlaceContactSchema } from '@/utils/placeValidation';

type Params = {
  params: {
    id: string;
  };
};

// PATCH /api/places/:id/contact
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = updatePlaceContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const place = await updatePlaceContact(id, parsed.data);

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/places/:id/contact error:', error);

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