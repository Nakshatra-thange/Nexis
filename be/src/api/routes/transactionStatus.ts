import { Router } from "express";
import { prisma } from "../../database/prisma";
import { getSolanaConnection } from "../../solana/connection";

const router = Router();

router.get("/api/transaction/:txId/status", async (req, res) => {
  try {
    const { txId } = req.params;

    const tx = await prisma.pendingTransaction.findUnique({
      where: { tx_id: txId },
    });

    if (!tx) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // If already final, return immediately
    if (tx.status === "confirmed" || tx.status === "failed") {
      return res.json({
        txId,
        status: tx.status,
        signature: tx.signature,
      });
    }

    // If submitted, verify on-chain
    if (tx.status === "submitted" && tx.signature) {
      const connection = getSolanaConnection();

      const status = await connection.getSignatureStatus(tx.signature);

      if (status?.value?.confirmationStatus === "finalized") {
        await prisma.pendingTransaction.update({
          where: { tx_id: txId },
          data: { status: "confirmed" },
        });

        return res.json({
          txId,
          status: "confirmed",
          signature: tx.signature,
        });
      }

      if (status?.value?.err) {
        await prisma.pendingTransaction.update({
          where: { tx_id: txId },
          data: { status: "failed" },
        });

        return res.json({
          txId,
          status: "failed",
          signature: tx.signature,
        });
      }
    }

    // Pending / signed / still processing
    return res.json({
      txId,
      status: tx.status,
      signature: tx.signature,
    });
  } catch (err) {
    console.error("Transaction status check failed:", err);
    return res.status(500).json({ error: "Status check failed" });
  }
});

export default router;
