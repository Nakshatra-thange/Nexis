import { prisma } from "../../database/prisma";
import { getSolanaConnection } from "../../solana/connection";

export async function checkTransactionHandler({
  transaction_id,
}: {
  transaction_id: string;
}) {
  const tx = await prisma.pendingTransaction.findUnique({
    where: { tx_id: transaction_id },
  });

  if (!tx) {
    return {
      content: [
        {
          type: "text",
          text: "Transaction not found.",
        },
      ],
    };
  }

  // If submitted, re-check chain
  if (tx.status === "submitted" && tx.signature) {
    const connection = getSolanaConnection();
    const status = await connection.getSignatureStatus(tx.signature);

    if (status?.value?.confirmationStatus === "finalized") {
      await prisma.pendingTransaction.update({
        where: { tx_id: transaction_id },
        data: { status: "confirmed" },
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Transaction confirmed!\n\nSignature:\n${tx.signature}`,
          },
        ],
      };
    }

    if (status?.value?.err) {
      await prisma.pendingTransaction.update({
        where: { tx_id: transaction_id },
        data: { status: "failed" },
      });

      return {
        content: [
          {
            type: "text",
            text: "❌ Transaction failed on-chain.",
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Transaction status: ${tx.status}`,
      },
    ],
  };
}
