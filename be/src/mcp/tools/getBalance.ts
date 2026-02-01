
import { rateLimit } from "../../security/rateLimiter";
import { limits } from "../../security/limits";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { AppError } from "../../errors/AppError";
import { getSolanaConnection } from "../../solana/connection";
import {
  createSession,
  validateSession,
  buildConnectionUrl,
} from "../../session/session.manager";

/**
 * MCP input schema (empty)
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
  rateLimit(
    `global:${sessionId}`,
    limits.global,
    "global"
  );

  rateLimit(
    `balance:${sessionId}`,
    limits.balance,
    "balance"
  );
  // 1. Validate or create session
  const validation = await validateSession(sessionId);

  if (!validation.valid) {
    const session = await createSession(sessionId);
    const url = buildConnectionUrl(session.connection_token);

    return {
      content: [
        {
          type: "text",
          text: `Please connect your wallet to continue:\n${url}`,
        },
      ],
    };
  }

  const session = validation.session!;

  // 2. Wallet not connected
  if (!session.wallet_address) {
    const url = buildConnectionUrl(session.connection_token);

    throw new AppError(
      "WALLET_NOT_CONNECTED",
      "Please connect your wallet to continue."
    );
    

    return {
      content: [
        {
          type: "text",
          text: `Please connect your wallet to continue:\n${url}`,
        },
      ],
    };
  }

  // 3. Wallet connected → query balances
  try {
    const connection = getSolanaConnection();

    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(session.wallet_address);
    } catch (e) {
      console.error("Invalid wallet address:", session.wallet_address);
      throw e;
    }

    const lamports = await connection.getBalance(walletPubkey, "confirmed");
    console.log("SOL balance fetched");

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
      console.log("Token accounts fetched");
    } catch (e) {
      console.error("Token account fetch failed", e);
      tokenAccounts = { value: [] }; // fallback
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

    // 4. Format response
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
  } catch (error) {
    console.error("get_balance error:", error);

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

