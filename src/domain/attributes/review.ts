import { z } from "zod";

export const SpecificRatingsSchema = z.object({
  cleanliness: z.number().default(0),
  service: z.number().default(0),
  value: z.number().default(0),
  location: z.number().default(0),
}).default({ cleanliness: 0, service: 0, value: 0, location: 0 });
