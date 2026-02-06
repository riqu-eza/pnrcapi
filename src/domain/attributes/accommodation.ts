import { z } from "zod";

// Generic room schema for all Accommodation types
const RoomSchema = z.object({
  name: z.string(),
  bedCount: z.number().int().default(1),
  amenities: z.array(z.string()).default([]),
  pricePerNight: z.number().optional(),
  maxGuests: z.number().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

// Accommodation attributes JSONB
export const AccommodationAttributes = z.object({
  rooms: z.array(RoomSchema).default([]),
  generalAmenities: z.array(z.string()).default([]),
  description: z.string().optional(),
  policies: z.object({
    petsAllowed: z.boolean().default(false),
    smokingAllowed: z.boolean().default(false),
    cancellationPolicy: z.string().optional(),
  }).default({ petsAllowed: false, smokingAllowed: false }),
});
