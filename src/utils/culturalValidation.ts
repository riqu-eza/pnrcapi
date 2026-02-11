import { z } from 'zod';

export const CreateExhibitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  theme: z.string().optional(),
  curator: z.string().optional(),
  organization: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPermanent: z.boolean().default(false),
  entryFee: z.number().min(0).optional(),
  currency: z.string().length(3).default('KES'),
  hasFreeEntry: z.boolean().default(false),
  freeEntryDays: z.array(z.string()).optional(),
  hasGuidedTours: z.boolean().default(false),
  tourSchedule: z.any().optional(),
  images: z.array(z.string().url()).optional(),
  virtualTourUrl: z.string().url().optional(),
  audioGuide: z.boolean().default(false),
  languages: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});

export const CreateExhibitionsSchema = z.object({
  exhibitions: z.array(CreateExhibitionSchema).min(1),
});

export const CreateArtifactSchema = z.object({
  exhibitionId: z.string().cuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  period: z.string().optional(),
  era: z.string().optional(),
  origin: z.string().optional(),
  culture: z.string().optional(),
  yearCreated: z.number().int().optional(),
  artist: z.string().optional(),
  maker: z.string().optional(),
  materials: z.array(z.string()).default([]),
  dimensions: z.any().optional(),
  weight: z.number().min(0).optional(),
  condition: z.string().optional(),
  conservationNotes: z.string().optional(),
  location: z.string().optional(),
  isOnDisplay: z.boolean().default(true),
  images: z.array(z.string().url()).optional(),
  has3DModel: z.boolean().default(false),
  model3DUrl: z.string().url().optional(),
  historicalValue: z.string().optional(),
  significance: z.string().optional(),
  acquisitionDate: z.string().datetime().optional(),
  acquisitionMethod: z.string().optional(),
  metadata: z.any().optional(),
});

export const CreateArtifactsSchema = z.object({
  artifacts: z.array(CreateArtifactSchema).min(1),
});