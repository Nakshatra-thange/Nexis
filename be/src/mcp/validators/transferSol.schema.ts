import { z } from "zod";

export const transferSolSchema = z.object({
  recipient_address: z.string().min(32),
  amount: z.number().positive().max(10_000), // cap to prevent abuse
  memo: z.string().max(120).optional(),
});
