import { z } from "zod";

export const MpesaDetailsSchema = z.object({
  phoneNumber: z.string().optional(),
  transactionCode: z.string().optional(),
  receiptNumber: z.string().optional(),
}).default({});

export const PaymentMetadataSchema = z.object({}).default({});
