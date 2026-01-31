import { prisma } from "../database/prisma";

export async function setupSession(
  sessionId: string,
  walletAddress?: string
) {
  await prisma.session.upsert({
    where: { session_id: sessionId },
    update: {
      wallet_address: walletAddress ?? null,
      status: walletAddress ? "connected" : "pending",
      token_expiry: new Date(Date.now() + 10 * 60 * 1000),
    },
    create: {
      session_id: sessionId,
      wallet_address: walletAddress ?? null,
      connection_token: "testtoken-" + sessionId,
      token_expiry: new Date(Date.now() + 10 * 60 * 1000),
      status: walletAddress ? "connected" : "pending",
    },
  });
}
