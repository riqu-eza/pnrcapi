import { z } from "zod";

export const UserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
}).default({});

export const LocationPreferencesSchema = z.object({
  homeCity: z.string().optional(),
  favoriteCities: z.array(z.string()).default([]),
  preferredCategories: z.array(z.string()).default([]),
}).default({
  favoriteCities: [],
  preferredCategories: [],
});

export const UserStatsSchema = z.object({
  listingsCount: z.number().default(0),
  bookingsCount: z.number().default(0),
  reviewsCount: z.number().default(0),
}).default({
  listingsCount: 0,
  bookingsCount: 0,
  reviewsCount: 0,
});

export const UserSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
  }).default({
    email: true,
    push: true,
  }),
  privacy: z.object({
    profileVisible: z.boolean().default(true),
  }).default({
    profileVisible: true,
  }),
}).default({
  notifications: { email: true, push: true },
  privacy: { profileVisible: true },
});

export const BusinessProfileSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
}).default({});
