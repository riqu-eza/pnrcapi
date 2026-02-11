import { NextResponse } from 'next/server';
import { listRooms, createRooms } from '@/services/accommodationRoomService';
import { CreateRoomsSchema } from '@/utils/accommodationValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/rooms
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const isAvailable = searchParams.get('isAvailable');

    const rooms = await listRooms(
      id,
      isAvailable !== null ? isAvailable === 'true' : undefined
    );

    return NextResponse.json({ status: 'success', data: rooms }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/rooms error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/rooms
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreateRoomsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rooms = await createRooms(id, parsed.data.rooms);

    return NextResponse.json({ status: 'success', data: rooms }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/places/:id/rooms error:', error);

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