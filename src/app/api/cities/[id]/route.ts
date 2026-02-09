import { NextResponse } from 'next/server';
import { getCityById, updateCity, deleteCity } from '@/services/cityService';
import { updateCitySchema } from '@/utils/cityValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/cities/:id
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'City ID is required' },
        { status: 400 }
      );
    }

    const city = await getCityById(id);
    if (!city) {
      return NextResponse.json(
        { status: 'error', message: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 'success', data: city },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/cities/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();

    const parsed = updateCitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const city = await updateCity(id, parsed.data);

    return NextResponse.json(
      { status: 'success', data: city },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cities/:id
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = params;

    await deleteCity(id);

    return NextResponse.json(
      { status: 'success', message: 'City deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
