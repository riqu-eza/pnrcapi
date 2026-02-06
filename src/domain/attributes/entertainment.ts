import { z } from "zod";

export const EntertainmentAttributes = z.object({
  type: z.string().optional(), // e.g., "Cinema", "Theater"
  ageRestriction: z.number().optional(),
  openingHours: z.string().optional(),
  ticketed: z.boolean().default(false),
  activities: z.array(z.string()).default([]),
});
