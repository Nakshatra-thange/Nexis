import { Router } from "express";
import { prisma } from "../../database/prisma";

export const sessionRouter = Router();

sessionRouter.get("/:token", async (req, res) => {
  const { token } = req.params;

  const session = await prisma.session.findUnique({
    where: { connection_token: token },
  });

  if (!session) {
    return res.status(404).json({ valid: false });
  }

  if (session.token_expiry < new Date()) {
    return res.status(400).json({ valid: false, expired: true });
  }

  res.json({
    valid: true,
    connected: Boolean(session.wallet_address),
    walletAddress: session.wallet_address,
  });
});
