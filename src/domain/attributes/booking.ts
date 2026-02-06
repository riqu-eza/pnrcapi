import { z } from "zod";

export const GuestsSchema = z.object({
  adults: z.number().default(1),
  children: z.number().default(0),
  infants: z.number().default(0),
}).default({
  adults: 1,
  children: 0,
  infants: 0,
});

export const BookingPricingSchema = z.object({
  base: z.number().default(0),
  taxes: z.number().default(0),
  fees: z.number().default(0),
  discount: z.number().default(0),
  total: z.number().default(0),
  currency: z.string().default("USD"),
}).default({
  base: 0,
  taxes: 0,
  fees: 0,
  discount: 0,
  total: 0,
  currency: "USD",
});
