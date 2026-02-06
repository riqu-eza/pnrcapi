import { z } from "zod";

const MenuItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
  available: z.boolean().default(true),
});

export const DiningAttributes = z.object({
  cuisines: z.array(z.string()).default([]),
  seatingOptions: z.object({
    indoor: z.boolean().default(true),
    outdoor: z.boolean().default(false),
    driveThrough: z.boolean().default(false),
  }).default({ indoor: true, outdoor: false, driveThrough: false }),
  averagePrice: z.number().optional(),
  menu: z.array(MenuItemSchema).default([]),
  specialServices: z.array(z.string()).default([]), // delivery, takeaway, reservations
});
