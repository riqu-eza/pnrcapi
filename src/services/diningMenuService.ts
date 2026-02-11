import { prisma } from '@/lib/prisma';
import { MealType, CuisineType, DietaryOption, Prisma } from '@prisma/client';

export interface CreateMenuItemData {
  name: string;
  description?: string;
  mealType: MealType;
  cuisineType?: CuisineType;
  ingredients: string[];
  allergens: string[];
  dietaryOptions?: DietaryOption[];
  spicyLevel?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  prepTime?: number;
  calories?: number;
  servingSize?: string;
  price: number;
  currency?: string;
  priceVariations?: any;
  isAvailable?: boolean;
  availableDays?: string[];
  availableHours?: any;
  isSignatureDish?: boolean;
  isChefSpecial?: boolean;
  isSeasonalDish?: boolean;
  images?: string[];
  pairsWith?: string[];
  metadata?: any;
  sortOrder?: number;
  sectionId?: string;
}

export interface CreateMenuSectionData {
  name: string;
  description?: string;
  sortOrder?: number;
}

export async function listMenuSections(placeId: string) {
  const sections = await prisma.diningMenuSection.findMany({
    where: { placeId, isActive: true },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return sections;
}

export async function createMenuSections(
  placeId: string,
  sectionsData: CreateMenuSectionData[]
) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  const sections = await prisma.diningMenuSection.createMany({
    data: sectionsData.map((section) => ({
      ...section,
      placeId,
    })),
  });

  return sections;
}

export async function listMenuItems(placeId: string, filters?: {
  mealType?: MealType;
  cuisineType?: CuisineType;
  isVegetarian?: boolean;
  isVegan?: boolean;
  maxPrice?: number;
}) {
  const where: Prisma.DiningMenuItemWhereInput = {
    placeId,
    isAvailable: true,
  };

  if (filters?.mealType) where.mealType = filters.mealType;
  if (filters?.cuisineType) where.cuisineType = filters.cuisineType;
  if (filters?.isVegetarian !== undefined) where.isVegetarian = filters.isVegetarian;
  if (filters?.isVegan !== undefined) where.isVegan = filters.isVegan;
  if (filters?.maxPrice) where.price = { lte: filters.maxPrice };

  const menuItems = await prisma.diningMenuItem.findMany({
    where,
    include: {
      section: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return menuItems;
}

export async function createMenuItems(placeId: string, itemsData: CreateMenuItemData[]) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Replace all menu items
  await prisma.diningMenuItem.deleteMany({
    where: { placeId },
  });

  const menuItems = await prisma.diningMenuItem.createMany({
    data: itemsData.map((item) => ({
      ...item,
      placeId,
    })),
  });

  return menuItems;
}

export async function updateMenuItem(id: string, data: Partial<CreateMenuItemData>) {
  const menuItem = await prisma.diningMenuItem.update({
    where: { id },
    data,
    include: {
      section: true,
    },
  });

  return menuItem;
}

export async function deleteMenuItem(id: string) {
  await prisma.diningMenuItem.delete({
    where: { id },
  });

  return { success: true };
}