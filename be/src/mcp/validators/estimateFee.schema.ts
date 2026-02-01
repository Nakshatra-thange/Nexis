import { z } from "zod";

export const estimateFeeSchema = z.object({
  recipient: z.string().optional(),
  amount: z.number().positive().optional(),
});
