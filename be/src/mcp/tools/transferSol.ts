import { prisma } from "../../database/prisma";
import { buildUnsignedSolTransfer } from "../../solana/transactionBuilder";
import crypto from "crypto";
import { AppError } from "../../errors/AppError";
import { rateLimit } from "../../security/rateLimiter";
import { limits } from "../../security/limits";
import { getActiveSession } from "../../session/getActiveSession";

export const transferSolTool = {
  name: "transfer_sol",
  description:
    "Create a SOL transfer transaction. The user must approve and sign it in their wallet.",
  inputSchema: {
    type: "object",
    properties: {
      recipient_address: { type: "string" },
      amount: { type: "number" },
      memo: { type: "string" },
    },
    required: ["recipient_address", "amount"],
  },
};



export async function transferSolHandler({
  recipient_address,
  amount,
  memo,
}: {
  recipient_address: string;
  amount: number;
  memo?: string;
}) {
  // 1. Get active session
  const session = await getActiveSession();

  if (!session) {
    throw new AppError(
      "WALLET_NOT_CONNECTED",
      "Please connect your wallet before making a transfer."
    );
  }

  const senderAddress = session.wallet_address;
  if (!senderAddress) {
    throw new AppError(
      "WALLET_NOT_CONNECTED",
      "Please connect your wallet before making a transfer."
    );
  }
  const effectiveSessionId = session.session_id;

  // Rate limiting
  rateLimit(`global:${effectiveSessionId}`, limits.global, "global");
  rateLimit(`transfer:${effectiveSessionId}`, limits.transfer, "transfer");

  // Check for existing pending transaction
  const existingTx = await prisma.pendingTransaction.findFirst({
    where: {
      session_id: effectiveSessionId,
      recipient_address,
      amount: BigInt(Math.floor(amount * 1_000_000_000)),
      status: {
        in: ["pending", "signed", "submitted"],
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (existingTx) {
    return {
      content: [
        {
          type: "text",
          text: `A transaction is already in progress.\n\nStatus: ${existingTx.status}\n\nApprove here:\n${process.env.FRONTEND_URL}/approve/${existingTx.tx_id}`,
        },
      ],
    };
  }

  // 2. Build unsigned transaction
  const { serializedTx, lamports } = await buildUnsignedSolTransfer({
    senderAddress,
    recipientAddress: recipient_address,
    amountSol: amount,
  });

  if (!serializedTx || !lamports) {
    throw new AppError(
      "TRANSACTION_BUILD_FAILED",
      "Failed to build transaction."
    );
  }

  // 3. Generate transaction ID
  const txId = crypto.randomUUID();

  if (!txId) {
    throw new AppError(
      "TRANSACTION_ID_GENERATION_FAILED",
      "Failed to generate transaction ID."
    );
  }

  // 4. Store pending transaction with effectiveSessionId
  await prisma.pendingTransaction.create({
    data: {
      tx_id: txId,
      session_id: effectiveSessionId,
      wallet_address: senderAddress,
      recipient_address,
      amount: lamports,
      tx_type: "transfer",
      unsigned_transaction: Buffer.from(serializedTx, "base64"),
      status: "pending",
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // 5. Return approval URL
  const approvalUrl = `${process.env.FRONTEND_URL}/sign/${txId}`;
  if (!approvalUrl) {
    throw new AppError(
      "APPROVAL_URL_GENERATION_FAILED",
      "Failed to generate approval URL."
    );
  }

  return {
    content: [
      {
        type: "text",
        text: `Transaction ready for approval:\n${approvalUrl}`,
      },
    ],
  };
}