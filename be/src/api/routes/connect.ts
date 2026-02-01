import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma";

export const connectRouter = Router();

const bodySchema = z.object({
  token: z.string(),
  walletAddress: z.string(),
});

connectRouter.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { token, walletAddress } = parsed.data;

  const session = await prisma.session.findUnique({
    where: { connection_token: token },
  });

  if (!session || session.token_expiry < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  await prisma.session.update({
    where: { session_id: session.session_id },
    data: {
      wallet_address: walletAddress,
      status: "connected",
    },
  });

  res.json({ success: true });
});
