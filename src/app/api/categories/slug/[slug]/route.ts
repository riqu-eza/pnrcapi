import { NextResponse } from 'next/server';
import { getCategoryBySlug } from '@/services/categoryService';

type Params = {
  params: {
    slug: string;
  };
};

// GET /api/categories/slug/:slug
export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') === 'true';

    if (!slug) {
      return NextResponse.json(
        { status: 'error', message: 'Category slug is required' },
        { status: 400 }
      );
    }

    const category = await getCategoryBySlug(slug, includeChildren);

    if (!category) {
      return NextResponse.json(
        { status: 'error', message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: category }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/categories/slug/:slug error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}