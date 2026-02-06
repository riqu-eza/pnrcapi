import { z } from "zod";

export const PlaceContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
}).default({});

export const PlaceImagesSchema = z.array(z.object({
  url: z.string(),
  caption: z.string().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().default(0),
})).default([]);

export const PlacePricingSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  currency: z.string().default("USD"),
}).default({ currency: "USD" });

export const PlaceStatsSchema = z.object({
  rating: z.number().default(0),
  reviews: z.number().default(0),
  bookings: z.number().default(0),
}).default({ rating: 0, reviews: 0, bookings: 0 });

export const BookingSettingsSchema = z.object({
  advanceNotice: z.string().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  cancellationPolicy: z.string().optional(),
}).default({});
