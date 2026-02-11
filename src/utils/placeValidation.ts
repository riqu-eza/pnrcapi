import { z } from 'zod';
import { PlaceStatus } from '@prisma/client';

export const createDraftPlaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  cityId: z.string().cuid('Invalid city ID'),
  primaryCategory: z.string().min(1, 'Primary category is required'),
  ownerId: z.string().cuid().optional(),
});

export const updatePlaceBasicSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
});

export const updatePlaceLocationSchema = z.object({
  address: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
});

export const updatePlaceContactSchema = z.object({
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
    })
    .optional()
    .nullable(),
});

export const updatePlaceAttributesSchema = z.object({
  attributes: z.any(),
});

export const updatePlaceMediaSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string().optional(),
        isPrimary: z.boolean().optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .optional()
    .nullable(),
  coverImage: z.string().url().optional().nullable(),
});

export const updatePlaceBookingSchema = z.object({
  isBookable: z.boolean().optional(),
  pricing: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      unit: z.string().optional(),
      currency: z.string().length(3).optional(),
    })
    .optional()
    .nullable(),
  bookingSettings: z
    .object({
      advanceNotice: z.number().int().min(0).optional(),
      minDuration: z.number().int().min(1).optional(),
      maxDuration: z.number().int().min(1).optional(),
      cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).optional(),
    })
    .optional()
    .nullable(),
});

export const updatePlaceTaxonomySchema = z.object({
  taxonomy: z.array(z.string()).min(1, 'At least one taxonomy is required'),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
});

export const linkPlaceToCategoriesSchema = z.object({
  categoryIds: z.array(z.string().cuid()).min(1, 'At least one category is required'),
});

export const updatePlaceStatusSchema = z.object({
  status: z.nativeEnum(PlaceStatus),
});