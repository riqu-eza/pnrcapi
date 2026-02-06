import { z } from "zod";

export const BlogStatsSchema = z.object({
  views: z.number().default(0),
  likes: z.number().default(0),
  shares: z.number().default(0),
}).default({ views: 0, likes: 0, shares: 0 });
