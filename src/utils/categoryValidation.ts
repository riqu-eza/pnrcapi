import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  parentId: z.string().cuid().optional().nullable(),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  parentId: z.string().cuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});