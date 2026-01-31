import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

import { getSolanaConnection } from "../../solana/connection";
import {
  createSession,
  validateSession,
  buildConnectionUrl,
} from "../../session/session.manager";

/**
 * MCP input schema
 */
export const getTransactionHistoryInputSchema = z.object({
  limit: z.number().min(1).max(50).optional(), // default handled in code
});

/**
 * get_transaction_history tool handler
 */
export async function getTransactionHistoryHandler({
  sessionId,
  limit = 10,
}: {
  sessionId: string;
  limit?: number;
}) {
  // 1. Validate session
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

    return {
      content: [
        {
          type: "text",
          text: `Please connect your wallet to continue:\n${url}`,
        },
      ],
    };
  }

  // 3. Fetch transaction history
  try {
    const connection = getSolanaConnection();

    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(session.wallet_address);
    } catch {
      return {
        content: [
          {
            type: "text",
            text: "Invalid wallet address stored for this session.",
          },
        ],
      };
    }

    // Fetch recent signatures
    const signatures = await connection.getSignaturesForAddress(
      walletPubkey,
      { limit },
      "confirmed"
    );

    if (signatures.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No recent transactions found for this wallet.",
          },
        ],
      };
    }

    let response = `Recent Transactions (last ${signatures.length}):\n\n`;

    for (const sig of signatures) {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!tx || !tx.meta) continue;

      const blockTime = tx.blockTime
        ? new Date(tx.blockTime * 1000).toLocaleString()
        : "Unknown time";

      let sender = "Unknown";
      let recipient = "Unknown";
      let amountSOL = 0;

      // Parse SOL transfer (most common case)
      for (const ix of tx.transaction.message.instructions) {
        if (
          "parsed" in ix &&
          ix.program === "system" &&
          ix.parsed?.type === "transfer"
        ) {
          sender = ix.parsed.info.source;
          recipient = ix.parsed.info.destination;
          amountSOL =
            Number(ix.parsed.info.lamports) / 1_000_000_000;
        }
      }

      const status = tx.meta.err ? "❌ Failed" : "✅ Confirmed";

      response += `• Signature: ${sig.signature}\n`;
      response += `  From: ${sender}\n`;
      response += `  To: ${recipient}\n`;
      response += `  Amount: ${amountSOL} SOL\n`;
      response += `  Status: ${status}\n`;
      response += `  Time: ${blockTime}\n\n`;

      /*
        OPTIONAL CACHE HOOK (future):
        await prisma.transactionHistory.upsert({...})
      */
    }

    return {
      content: [
        {
          type: "text",
          text: response.trim(),
        },
      ],
    };
  } catch (error) {
    console.error("get_transaction_history error:", error);

    return {
      content: [
        {
          type: "text",
          text:
            "Failed to fetch transaction history due to a Solana RPC error. Please try again shortly.",
        },
      ],
    };
  }
}
