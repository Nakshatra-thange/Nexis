"use client";

// All imports preserved - no changes
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

// Original type definition - no changes
type PendingTx = {
  tx_id: string;
  wallet_address: string;
  recipient_address: string;
  amount: number; // lamports
  status: string;
  expires_at: string;
};

// Original constants - no changes
const LAMPORTS_PER_SOL = 1_000_000_000;
const ESTIMATED_FEE_SOL = 0.000005;

export default function ApproveTxPage() {
  // All original hooks and logic - no changes
  const { txId } = useParams<{ txId: string }>();
  const router = useRouter();
  const { publicKey, signTransaction } = useWallet();

  const [tx, setTx] = useState<PendingTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Original useEffect - no changes
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

  // Original handleReject function - no changes
  async function handleReject() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${txId}/cancel`,
      { method: "POST" }
    );

    router.push("/");
  }

  // Original handleApprove function - no changes
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

  // Original calculations - no changes
  const amountSol = tx ? tx.amount / LAMPORTS_PER_SOL : 0;
  const total = amountSol + ESTIMATED_FEE_SOL;
  const expirySeconds = tx ? Math.max(
    0,
    Math.floor((new Date(tx.expires_at).getTime() - Date.now()) / 1000)
  ) : 0;

  // Visual redesign only - all logic preserved
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white"></div>
          <p className="text-sm text-neutral-500">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-3 text-white">Transaction Error</h2>
          <p className="mb-6 text-sm text-neutral-400">{error}</p>
          <button 
            onClick={() => router.push("/")}
            className="rounded-lg border border-neutral-700 bg-transparent px-6 py-2.5 text-sm text-neutral-300 transition-all hover:border-neutral-500"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!tx) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto max-w-lg animate-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-white">Approve Transaction</h2>
          <p className="text-sm text-neutral-500">
            Review the details carefully before signing
          </p>
        </div>

        {/* Transaction Details Card */}
        <div className="mb-6 space-y-6 rounded-lg border border-neutral-800 bg-neutral-900/30 p-8 backdrop-blur-sm">
          {/* From Address */}
          <div>
            <div className="mb-1.5 text-xs uppercase tracking-wider text-neutral-600">
              From
            </div>
            <div className="font-mono text-sm text-neutral-300">
              {tx.wallet_address}
            </div>
          </div>

          {/* To Address */}
          <div>
            <div className="mb-1.5 text-xs uppercase tracking-wider text-neutral-600">
              To
            </div>
            <div className="font-mono text-sm text-neutral-300">
              {tx.recipient_address}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-800"></div>

          {/* Amount Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Amount</span>
              <span className="font-mono text-sm text-white">
                {amountSol.toFixed(6)} SOL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Estimated Fee</span>
              <span className="font-mono text-sm text-neutral-400">
                {ESTIMATED_FEE_SOL} SOL
              </span>
            </div>
            <div className="border-t border-neutral-800 pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-300">Total</span>
                <span className="font-mono text-base font-medium text-white">
                  {total.toFixed(6)} SOL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        <div className="mb-8 rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3">
          <p className="text-xs text-amber-500/90">
            ⏱ Expires in {expirySeconds} seconds
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleReject}
            className="rounded-lg border border-neutral-700 bg-transparent px-6 py-3 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-500"
          >
            Reject
          </button>
          <button 
            onClick={handleApprove}
            className="rounded-lg border border-neutral-700 bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:border-neutral-500"
          >
            Approve & Sign
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-8 rounded-lg border border-neutral-800/50 bg-neutral-900/20 px-4 py-3">
          <p className="text-xs leading-relaxed text-neutral-600">
            Double-check the recipient address and amount. Transactions on the blockchain 
            are irreversible once confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}