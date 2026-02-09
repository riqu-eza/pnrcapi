import { NextResponse } from 'next/server';
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryBreadcrumb,
} from '@/services/categoryService';
import { updateCategorySchema } from '@/utils/categoryValidation';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/categories/:id
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const getBreadcrumb = searchParams.get('breadcrumb') === 'true';

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Return breadcrumb
    if (getBreadcrumb) {
      const breadcrumb = await getCategoryBreadcrumb(id);
      return NextResponse.json({ status: 'success', data: breadcrumb }, { status: 200 });
    }

    const category = await getCategoryById(id, includeChildren);

    if (!category) {
      return NextResponse.json(
        { status: 'error', message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: category }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/categories/:id error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/:id
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: 'error', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const category = await updateCategory(id, parsed.data);

    return NextResponse.json({ status: 'success', data: category }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/categories/:id error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('already exists') || error.message.includes('circular')) {
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

// DELETE /api/categories/:id
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get('cascade') === 'true';

    await deleteCategory(id, cascade);

    return NextResponse.json(
      { status: 'success', message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE /api/categories/:id error:', error);

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