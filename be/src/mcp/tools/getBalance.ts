import crypto from "crypto";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

import { rateLimit } from "../../security/rateLimiter";
import { limits } from "../../security/limits";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../database/prisma";
import { getSolanaConnection } from "../../solana/connection";
import { buildConnectionUrl } from "../../session/session.manager";

/**
 * MCP input schema
 */
export const getBalanceInputSchema = z.object({
  method: z.literal("get_balance"),
  params: z.object({}).optional(),
});

export async function getBalanceHandler({
  sessionId,
}: {
  sessionId: string;
}) {
  // ---- rate limits ----
  rateLimit(`global:${sessionId}`, limits.global, "global");
  rateLimit(`balance:${sessionId}`, limits.balance, "balance");

  // ---- get latest connected session ----
  let session = await prisma.session.findFirst({
    where: { status: "connected" },
    orderBy: { created_at: "desc" },
  });

  // ---- no session at all → create connection token ----
  if (!session) {
    const token = crypto.randomUUID();

    await prisma.session.create({
      data: {
        session_id: token,
        connection_token: token,
        token_expiry: new Date(Date.now() + 10 * 60 * 1000),
        status: "pending",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `"To continue, please connect your wallet using the link below 👇"
\n${buildConnectionUrl(token)}`,
        },
      ],
    };
  }

  // ---- session exists but wallet not connected ----
  if (!session.wallet_address) {
    throw new AppError(
      "WALLET_NOT_CONNECTED",
      `Please connect your wallet:\n${buildConnectionUrl(
        session.connection_token
      )}`
    );
  }

  // ---- fetch balances ----
  try {
    const connection = getSolanaConnection();

    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(session.wallet_address);
    } catch {
      throw new AppError(
        "INVALID_WALLET",
        "Invalid wallet address stored for this session."
      );
    }

    const lamports = await connection.getBalance(walletPubkey, "confirmed");
    const solBalance = lamports / 1_000_000_000;

    let tokenAccounts;
    try {
      tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        }
      );
    } catch {
      tokenAccounts = { value: [] };
    }

    const tokens = tokenAccounts.value
      .map((acc: any) => {
        const info = acc.account.data.parsed.info;
        return {
          mint: info.mint,
          amount: info.tokenAmount.uiAmount,
        };
      })
      .filter((t: any) => t.amount && t.amount > 0);

    let response = `Wallet: ${session.wallet_address}\n`;
    response += `SOL Balance: ${solBalance.toFixed(4)} SOL\n`;

    if (tokens.length > 0) {
      response += `\nSPL Tokens:\n`;
      for (const token of tokens) {
        response += `• ${token.mint}: ${token.amount}\n`;
      }
    } else {
      response += `\nNo SPL tokens found.`;
    }

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  } catch (err) {
    console.error("get_balance error:", err);

    return {
      content: [
        {
          type: "text",
          text:
            "Failed to fetch wallet balance due to a Solana RPC error. Please try again shortly.",
        },
      ],
    };
  }
}
