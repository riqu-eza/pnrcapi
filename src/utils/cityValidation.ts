// /utils/cityValidation.ts
import { z } from 'zod';

export const createCitySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  country: z.string().min(2),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverImage: z.string().url().optional(),
  description: z.string().optional(),
});

export const updateCitySchema = createCitySchema.partial();
