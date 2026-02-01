import { Router } from "express";
import { prisma } from "../../database/prisma";
import { Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { z } from "zod";

export const txIdSchema = z.object({
  params: z.object({
    txId: z.string().uuid(),
  }),
});

export const transactionRouter = Router();

transactionRouter.get("/:txId", async (req, res) => {
  const tx = await prisma.pendingTransaction.findUnique({
    where: { tx_id: req.params.txId },
  });

  if (!tx) return res.status(404).json({ error: "Not found" });

  res.json(tx);
});


transactionRouter.post("/:txId/sign", async (req, res) => {
  const { signedTx } = req.body;

  if (!signedTx) return res.status(400).json({ error: "Missing signedTx" });

  const tx = await prisma.pendingTransaction.findUnique({
    where: { tx_id: req.params.txId },
  });

  if (!tx) return res.status(404).json({ error: "Not found" });

  const connection = new Connection(process.env.SOLANA_RPC_URL!);

  const signature = await connection.sendRawTransaction(
    bs58.decode(signedTx)
  );

  await prisma.pendingTransaction.update({
    where: { tx_id: tx.tx_id },
    data: {
      signature,
      status: "submitted",
    },
  });

  res.json({ signature });
});
