import { z } from 'zod';
import { RoomType, BedType } from '@prisma/client';

const BedSchema = z.object({
  bedType: z.nativeEnum(BedType),
  quantity: z.number().int().min(1),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  roomType: z.nativeEnum(RoomType),
  roomNumber: z.string().optional(),
  floor: z.number().int().optional(),
  maxGuests: z.number().int().min(1),
  maxAdults: z.number().int().min(1),
  maxChildren: z.number().int().min(0),
  beds: z.array(BedSchema).min(1),
  sizeSquareMeters: z.number().min(0).optional(),
  hasBalcony: z.boolean().default(false),
  hasKitchen: z.boolean().default(false),
  hasLivingRoom: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  basePrice: z.number().min(0),
  weekendPrice: z.number().min(0).optional(),
  currency: z.string().length(3).default('KES'),
  seasonalPricing: z.any().optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.any().optional(),
  sortOrder: z.number().int().default(0),
});

export const CreateRoomsSchema = z.object({
  rooms: z.array(CreateRoomSchema).min(1),
});