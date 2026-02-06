import { z } from "zod";

export const EventLocationSchema = z.object({
  type: z.string().optional(),        // venue, online
  venueId: z.string().optional(),
  address: z.string().optional(),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).default({}),
}).default({ coordinates: {} });

export const TicketInfoSchema = z.object({
  isFree: z.boolean().default(true),
  price: z.number().optional(),
  currency: z.string().default("USD"),
  url: z.string().optional(),
  capacity: z.number().optional(),
  sold: z.number().default(0),
}).default({ isFree: true, sold: 0, currency: "USD" });
