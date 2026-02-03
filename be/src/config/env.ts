import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DATABASE_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
});

export const env = envSchema.parse(process.env);
