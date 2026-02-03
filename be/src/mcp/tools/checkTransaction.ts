import { prisma } from "../../database/prisma";
import { getSolanaConnection } from "../../solana/connection";
import { getActiveSession } from "../../session/getActiveSession";
export async function checkTransactionHandler({
  transaction_id,
}: {
  transaction_id: string;
}) {

  const session = await getActiveSession();

if (!session) {
  return {
    content: [{ type: "text", text: "No active wallet session." }],
  };
}

const tx = await prisma.pendingTransaction.findFirst({
  where: {
    tx_id: transaction_id,
    session_id: session.session_id,
  },
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
            text: `✅ Transaction created successfully!

Next step:
1️⃣ Open the link below  
2️⃣ Review the transaction  
3️⃣ Approve & sign in your wallet  :\n${tx.signature}`,
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
