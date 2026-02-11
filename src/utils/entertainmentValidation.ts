import { z } from 'zod';
import { EventCategory } from '@prisma/client';

export const CreateShowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(EventCategory),
  durationMinutes: z.number().int().min(1),
  isRecurring: z.boolean().default(false),
  performers: z.array(z.string()).default([]),
  director: z.string().optional(),
  producer: z.string().optional(),
  venueCapacity: z.number().int().min(1).optional(),
  seatingType: z.string().optional(),
  ticketPricing: z.any(),
  images: z.array(z.string().url()).optional(),
  trailerUrl: z.string().url().optional(),
  ageRating: z.string().optional(),
  language: z.string().optional(),
  subtitles: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});

export const CreateShowsSchema = z.object({
  shows: z.array(CreateShowSchema).min(1),
});

export const CreatePerformanceSchema = z.object({
  showId: z.string().cuid(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  availableSeats: z.number().int().min(0),
  totalSeats: z.number().int().min(1),
  ticketPricing: z.any().optional(),
  metadata: z.any().optional(),
});

export const CreatePerformancesSchema = z.object({
  performances: z.array(CreatePerformanceSchema).min(1),
});