import crypto from "crypto";
import { prisma } from "../database/prisma";

const TOKEN_EXPIRY_MINUTES = 10;

export async function createSession(sessionId: string) {
  const existing = await prisma.session.findUnique({
    where: { session_id: sessionId },
  });

  if (existing) {
    return existing;
  }

  const connectionToken = crypto.randomBytes(16).toString("hex"); // 32 chars
  const tokenExpiry = new Date(
    Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  const session = await prisma.session.create({
    data: {
      session_id: sessionId,
      connection_token: connectionToken,
      token_expiry: tokenExpiry,
      status: "pending",
    },
  });

  return session;
}
export function buildConnectionUrl(token: string) {
  return `${process.env.WEBAPP_URL}/connect?token=${token}`;
}

export async function validateSession(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { session_id: sessionId },
    });
  
    if (!session) {
      return { valid: false, reason: "SESSION_NOT_FOUND" };
    }
  
    if (session.status === "expired") {
      return { valid: false, reason: "SESSION_EXPIRED" };
    }
  
    if (
      session.status === "pending" &&
      session.token_expiry.getTime() < Date.now()
    ) {
      await prisma.session.update({
        where: { session_id: sessionId },
        data: { status: "expired" },
      });
  
      return { valid: false, reason: "TOKEN_EXPIRED" };
    }

    
  
    // update last_used_at on every valid call
    await prisma.session.update({
      where: { session_id: sessionId },
      data: { last_used_at: new Date() },
    });
  
    return {
      valid: true,
      session,
      walletConnected: !!session.wallet_address,
    };
  }
  /**
 * Link wallet to session using connection token
 */
export async function linkWalletWithToken(
    token: string,
    walletAddress: string
  ) {
    const session = await prisma.session.findUnique({
      where: { connection_token: token },
    });
  
    if (!session) {
      throw new Error("INVALID_TOKEN");
    }
  
    if (session.status !== "pending") {
      throw new Error("TOKEN_ALREADY_USED");
    }
  
    if (session.token_expiry.getTime() < Date.now()) {
      await prisma.session.update({
        where: { session_id: session.session_id },
        data: { status: "expired" },
      });
  
      throw new Error("TOKEN_EXPIRED");
    }
  
    const updatedSession = await prisma.session.update({
      where: { session_id: session.session_id },
      data: {
        wallet_address: walletAddress,
        status: "connected",
        last_used_at: new Date(),
        // token stays but is now useless since status ≠ pending
      },
    });
  
    return updatedSession;
  }
  