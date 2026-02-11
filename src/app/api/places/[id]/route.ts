import { NextResponse } from 'next/server';
import {
  getPlaceById,
  updatePlaceBasicInfo,
  updatePlaceStatus,
  deletePlace,
} from '@/services/placeService';
import { updatePlaceBasicSchema, updatePlaceStatusSchema } from '@/utils/placeValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = params;

    const place = await getPlaceById(id);

    if (!place) {
      return NextResponse.json(
        { status: 'error', message: 'Place not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/places/:id - Update basic info
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = updatePlaceBasicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const place = await updatePlaceBasicInfo(id, parsed.data);

    return NextResponse.json({ status: 'success', data: place }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/places/:id error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/places/:id
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = params;

    await deletePlace(id);

    return NextResponse.json(
      { status: 'success', message: 'Place deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE /api/places/:id error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('Cannot delete')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}