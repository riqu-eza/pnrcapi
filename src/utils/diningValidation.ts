import { z } from 'zod';
import { MealType, CuisineType, DietaryOption } from '@prisma/client';

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  mealType: z.nativeEnum(MealType),
  cuisineType: z.nativeEnum(CuisineType).optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  dietaryOptions: z.array(z.nativeEnum(DietaryOption)).optional(),
  spicyLevel: z.number().int().min(0).max(5).optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  prepTime: z.number().int().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  servingSize: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('KES'),
  priceVariations: z.any().optional(),
  isAvailable: z.boolean().default(true),
  availableDays: z.array(z.string()).optional(),
  availableHours: z.any().optional(),
  isSignatureDish: z.boolean().default(false),
  isChefSpecial: z.boolean().default(false),
  isSeasonalDish: z.boolean().default(false),
  images: z.array(z.string().url()).optional(),
  pairsWith: z.array(z.string()).optional(),
  metadata: z.any().optional(),
  sortOrder: z.number().int().default(0),
  sectionId: z.string().cuid().optional(),
});

export const CreateMenuItemsSchema = z.object({
  menuItems: z.array(CreateMenuItemSchema).min(1),
});

export const CreateMenuSectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const CreateMenuSectionsSchema = z.object({
  sections: z.array(CreateMenuSectionSchema).min(1),
});