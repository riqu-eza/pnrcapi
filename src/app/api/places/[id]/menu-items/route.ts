import { NextResponse } from 'next/server';
import { listMenuItems, createMenuItems } from '@/services/diningMenuService';
import { CreateMenuItemsSchema } from '@/utils/diningValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/places/:id/menu-items
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const filters = {
      mealType: searchParams.get('mealType') as any,
      cuisineType: searchParams.get('cuisineType') as any,
      isVegetarian: searchParams.get('isVegetarian') === 'true' ? true : undefined,
      isVegan: searchParams.get('isVegan') === 'true' ? true : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? parseFloat(searchParams.get('maxPrice')!)
        : undefined,
    };

    const menuItems = await listMenuItems(id, filters);

    return NextResponse.json({ status: 'success', data: menuItems }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/places/:id/menu-items error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/places/:id/menu-items
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = CreateMenuItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const menuItems = await createMenuItems(id, parsed.data.menuItems);

    return NextResponse.json({ status: 'success', data: menuItems }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/places/:id/menu-items error:', error);

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