"use client";

import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function ConnectPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  async function linkWallet() {
    if (!publicKey || !token) return;

    // Use same-origin API route so the browser doesn't hit the backend directly (avoids CORS / "Failed to fetch")
    const res = await fetch("/api/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        walletAddress: publicKey.toBase58(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((data as { error?: string }).error || "Failed to connect wallet.");
      return;
    }

    alert("Wallet connected! You can return to Claude.");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Connect your wallet</h2>

      {!connected ? (
        <button onClick={() => setVisible(true)}>
          Select & Connect Wallet
        </button>
      ) : (
        <>
          <p>Wallet: {publicKey?.toBase58()}</p>
          <button onClick={linkWallet}>Confirm Connection</button>
        </>
      )}
    </div>
  );
}