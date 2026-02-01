'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
export default function WalletConnectButton() {
  const {
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
  } = useWallet();
  const { setVisible } = useWalletModal();
  if (connected) {
    return (
      <button onClick={disconnect}>
        {publicKey?.toBase58().slice(0, 6)}...
        {publicKey?.toBase58().slice(-4)} · Disconnect
      </button>
    );
  }

  return (
    <button onClick={() => setVisible(true)} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>

  );
}
