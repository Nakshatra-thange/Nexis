import { prisma } from "./prisma";
import crypto from "crypto";

export async function createSession(sessionId: string) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  return prisma.session.create({
    data: {
      session_id: sessionId,
      connection_token: token,
      token_expiry: tokenExpiry,
      status: "pending",
    },
  });
}
export async function getSessionByToken(token: string) {
    return prisma.session.findUnique({
      where: { connection_token: token },
    });
  }
  export async function updateSessionWallet(
    sessionId: string,
    walletAddress: string
  ) {
    return prisma.session.update({
      where: { session_id: sessionId },
      data: {
        wallet_address: walletAddress,
        status: "connected",
        last_used_at: new Date(),
      },
    });
  }
  export async function checkSessionExists(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { session_id: sessionId },
      select: { session_id: true },
    });
  
    return !!session;
  }

  export async function markSessionUsed(sessionId: string) {
    return prisma.session.update({
      where: { session_id: sessionId },
      data: {
        last_used_at: new Date(),
      },
    });
  }
  export function isTokenValid(expiry: Date) {
    return expiry.getTime() > Date.now();
  }
  