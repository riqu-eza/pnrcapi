import { z } from "zod";

export const CultureAttributes = z.object({
  type: z.string().optional(), // Museum, Landmark, Heritage
  entryFee: z.number().optional(),
  guidedToursAvailable: z.boolean().default(false),
  facilities: z.array(z.string()).default([]), // parking, gift shop, restrooms
  openingHours: z.string().optional(),
  events: z.array(z.object({
    name: z.string(),
    date: z.string(),
    description: z.string().optional(),
  })).default([]),
});
