import { Router } from "express";
import { prisma } from "../../database/prisma";
import { Connection, Transaction } from "@solana/web3.js";
import { getSolanaConnection } from "../../solana/connection";
import { waitForConfirmation } from "../../solana/confirmTransaction";
const router = Router();

router.post("/api/transaction/:txId/sign", async (req, res) => {
  try {
    const { txId } = req.params;
    const { signedTransaction } = req.body;

    if (!signedTransaction) {
      return res.status(400).json({ error: "Missing signed transaction" });
    }

    // 1. Fetch pending transaction
    const tx = await prisma.pendingTransaction.findUnique({
      where: { tx_id: txId },
    });

    if (!tx) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    if (tx.expires_at < new Date()) {
      return res.status(400).json({ error: "Transaction expired" });
    }

    // 2. Deserialize signed transaction
    const transaction = Transaction.from(
      Buffer.from(signedTransaction, "base64")
    );

    // 3. Verify signer matches expected wallet
    const signer = transaction.signatures[0]?.publicKey?.toBase58();

    if (!signer || signer !== tx.wallet_address) {
      return res.status(403).json({
        error: "Signed wallet does not match transaction sender",
      });
    }

    // 4. Update DB → signed
    await prisma.pendingTransaction.update({
      where: { tx_id: txId },
      data: { status: "signed" },
    });

    // 5. Submit transaction
    const connection = getSolanaConnection();
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: false }
    );

    // 6. Update DB → submitted
    await prisma.pendingTransaction.update({
      where: { tx_id: txId },
      data: {
        signature,
        status: "submitted",
      },
    });

    // 7. Wait for confirmation (async, non-blocking)
    waitForConfirmation(txId, signature, connection).catch(console.error);

    return res.json({
      success: true,
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    });
  } catch (err) {
    console.error("Transaction signing failed:", err);
    return res.status(500).json({ error: "Signing failed" });
  }
});

export default router;
