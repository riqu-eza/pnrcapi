import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CategoryFilters {
  isActive?: boolean;
  parentId?: string | null;
  includeChildren?: boolean;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  parentId?: string | null;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  parentId?: string | null;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// List categories with optional filters
export async function listCategories(filters: CategoryFilters = {}) {
  const { isActive, parentId, includeChildren = false } = filters;

  const where: Prisma.CategoryWhereInput = {};

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (parentId !== undefined) {
    where.parentId = parentId;
  }

  const include: Prisma.CategoryInclude = {
    parent: true,
    _count: {
      select: {
        children: true,
        placeLinks: true,
      },
    },
  };

  if (includeChildren) {
    include.children = {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    };
  }

  const categories = await prisma.category.findMany({
    where,
    include,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return categories;
}

// Get category tree (all categories with nested children)
export async function getCategoryTree() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      children: {
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: { placeLinks: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { placeLinks: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Return only root categories (those without parents)
  return categories.filter((cat) => cat.parentId === null);
}

// Get category by ID
export async function getCategoryById(id: string, includeChildren = false) {
  const include: Prisma.CategoryInclude = {
    parent: true,
    _count: {
      select: {
        children: true,
        placeLinks: true,
      },
    },
  };

  if (includeChildren) {
    include.children = {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { placeLinks: true },
        },
      },
    };
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include,
  });

  return category;
}

// Get category by slug
export async function getCategoryBySlug(slug: string, includeChildren = false) {
  const include: Prisma.CategoryInclude = {
    parent: true,
    _count: {
      select: {
        children: true,
        placeLinks: true,
      },
    },
  };

  if (includeChildren) {
    include.children = {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { placeLinks: true },
        },
      },
    };
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    include,
  });

  return category;
}

// Create category
export async function createCategory(data: CreateCategoryData) {
  // Validate parent exists if parentId provided
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new Error('Parent category not found');
    }
  }

  // Check if slug already exists
  const existing = await prisma.category.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new Error('Category with this slug already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      icon: data.icon,
      description: data.description,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive ?? true,
    },
    include: {
      parent: true,
      _count: {
        select: {
          children: true,
          placeLinks: true,
        },
      },
    },
  });

  return category;
}

// Update category
export async function updateCategory(id: string, data: UpdateCategoryData) {
  // Check if category exists
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Category not found');
  }

  // Prevent circular reference (category cannot be its own parent)
  if (data.parentId === id) {
    throw new Error('Category cannot be its own parent');
  }

  // Validate parent exists if parentId provided
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new Error('Parent category not found');
    }

    // Check for circular reference in the hierarchy
    const isCircular = await checkCircularReference(id, data.parentId);
    if (isCircular) {
      throw new Error('Cannot create circular category hierarchy');
    }
  }

  // Check slug uniqueness if updating slug
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new Error('Category with this slug already exists');
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          children: true,
          placeLinks: true,
        },
      },
    },
  });

  return category;
}

// Delete category
export async function deleteCategory(id: string, cascade = false) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      _count: {
        select: { placeLinks: true },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Check if category has children
  if (category.children.length > 0 && !cascade) {
    throw new Error(
      'Cannot delete category with subcategories. Use cascade=true to delete all subcategories.'
    );
  }

  // Check if category is linked to places
  if (category._count.placeLinks > 0) {
    throw new Error(
      `Cannot delete category. It is linked to ${category._count.placeLinks} place(s). Remove links first.`
    );
  }

  if (cascade && category.children.length > 0) {
    // Delete all children recursively
    for (const child of category.children) {
      await deleteCategory(child.id, true);
    }
  }

  await prisma.category.delete({
    where: { id },
  });

  return { success: true };
}

// Helper: Check for circular reference in category hierarchy
async function checkCircularReference(
  categoryId: string,
  newParentId: string
): Promise<boolean> {
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === categoryId) {
      return true; // Circular reference detected
    }

    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = parent?.parentId || null;
  }

  return false;
}

// Get category breadcrumb (path from root to category)
export async function getCategoryBreadcrumb(categoryId: string) {
  const breadcrumb: Array<{ id: string; name: string; slug: string }> = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category = await prisma.category.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, slug: true, parentId: true },
    });

    if (!category) break;

    breadcrumb.unshift({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });

    currentId = category.parentId;
  }

  return breadcrumb;
}