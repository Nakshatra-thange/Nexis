"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

type PendingTx = {
  tx_id: string;
  wallet_address: string;
  recipient_address: string;
  amount: number; // lamports
  status: string;
  expires_at: string;
};

const LAMPORTS_PER_SOL = 1_000_000_000;
const ESTIMATED_FEE_SOL = 0.000005;

export default function ApproveTxPage() {
  const { txId } = useParams<{ txId: string }>();
  const router = useRouter();
  const { publicKey, signTransaction } = useWallet();

  const [tx, setTx] = useState<PendingTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTx() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${txId}`
        );

        if (!res.ok) {
          throw new Error("Transaction not found");
        }

        const data = await res.json();

        if (data.status !== "pending") {
          throw new Error("Transaction is no longer pending");
        }

        if (new Date(data.expires_at).getTime() < Date.now()) {
          throw new Error("Transaction has expired");
        }

        setTx(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTx();
  }, [txId]);

  async function handleReject() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${txId}/cancel`,
      { method: "POST" }
    );

    router.push("/");
  }

  async function handleApprove() {
    if (!publicKey || !signTransaction || !tx) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${txId}`
      );
      const { unsignedTransaction } = await res.json();

      const txBuffer = Buffer.from(unsignedTransaction, "base64");
      const transaction = Transaction.from(txBuffer);

      const signedTx = await signTransaction(transaction);

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${txId}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransaction: signedTx.serialize().toString("base64"),
          }),
        }
      );

      router.push("/success");
    } catch (err) {
      console.error(err);
      alert("Failed to sign transaction");
    }
  }

  if (loading) return <p>Loading transaction...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!tx) return null;

  const amountSol = tx.amount / LAMPORTS_PER_SOL;
  const total = amountSol + ESTIMATED_FEE_SOL;
  const expirySeconds = Math.max(
    0,
    Math.floor((new Date(tx.expires_at).getTime() - Date.now()) / 1000)
  );

  return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
      <h2>Approve Transaction</h2>

      <p><b>From:</b> {tx.wallet_address}</p>
      <p><b>To:</b> {tx.recipient_address}</p>
      <p><b>Amount:</b> {amountSol.toFixed(6)} SOL</p>
      <p><b>Estimated Fee:</b> {ESTIMATED_FEE_SOL} SOL</p>
      <p><b>Total:</b> {total.toFixed(6)} SOL</p>

      <p style={{ color: "orange" }}>
        Expires in {expirySeconds} seconds
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={handleApprove}>Approve & Sign</button>
        <button onClick={handleReject}>Reject</button>
      </div>
    </div>
  );
}
