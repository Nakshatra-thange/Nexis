import { Connection } from "@solana/web3.js";
import { prisma } from "../database/prisma";

export async function waitForConfirmation(
  txId: string,
  signature: string,
  connection: Connection
) {
  try {
    const result = await connection.confirmTransaction(
      signature,
      "finalized"
    );

    if (result.value.err) {
      await prisma.pendingTransaction.update({
        where: { tx_id: txId },
        data: { status: "failed" },
      });
      return;
    }

    await prisma.pendingTransaction.update({
      where: { tx_id: txId },
      data: { status: "confirmed" },
    });
  } catch (err) {
    console.error("Confirmation error:", err);
    await prisma.pendingTransaction.update({
      where: { tx_id: txId },
      data: { status: "failed" },
    });
  }
}
