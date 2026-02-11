import { NextResponse } from 'next/server';
import { updatePlaceBooking } from '@/services/placeService';
import { updatePlaceBookingSchema } from '@/utils/placeValidation';

type Params = {
  params: {
    id: string;
  };
};

// PATCH /api/places/:id/booking
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = updatePlaceBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Normalize parsed.data so `pricing` is undefined instead of null to match UpdatePlaceBookingData
    const updateData = {
      ...parsed.data,
      pricing: parsed.data.pricing ?? undefined,
    };

    const place = await updatePlaceBooking(id, updateData);

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/places/:id/booking error:', error);

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