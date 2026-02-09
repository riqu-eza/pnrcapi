import { NextResponse } from 'next/server';
import { listCategories, createCategory, getCategoryTree } from '@/services/categoryService';
import { createCategorySchema } from '@/utils/categoryValidation';

// GET /api/categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const isActiveParam = searchParams.get('isActive');
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const getTree = searchParams.get('tree') === 'true';

    // Return full category tree
    if (getTree) {
      const tree = await getCategoryTree();
      return NextResponse.json({ status: 'success', data: tree }, { status: 200 });
    }

    // Return filtered list
    const filters = {
      isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
      parentId: parentId === 'null' ? null : parentId || undefined,
      includeChildren,
    };

    const categories = await listCategories(filters);

    return NextResponse.json({ status: 'success', data: categories }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const category = await createCategory(parsed.data);
    console.log('Created category:', category);
    return NextResponse.json({ status: 'success', data: category }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/categories error:', error);

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 409 }
      );
    }

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