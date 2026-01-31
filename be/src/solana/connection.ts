import {
    Connection,
    clusterApiUrl
  } from "@solana/web3.js";


  type BlockhashWithExpiryBlockHeight = {
    blockhash: Blockhash;
    lastValidBlockHeight: number;
}
  const RPC_URL =
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;
  
  /**
   * Singleton Solana connection
   */
  let connection: Connection | null = null;
  
  /**
   * Create or return Solana RPC connection
   */
  export function getSolanaConnection(): Connection {
    if (!connection) {
      connection = new Connection(RPC_URL, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60_000,
      });
    }
  
    return connection;
  }
  async function retry<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
  
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return retry(fn, retries - 1);
    }
  }

  export function resetSolanaConnection() {
    connection = null;
  }
  
  
export async function checkSolanaHealth(): Promise<boolean> {
    const conn = getSolanaConnection();
  
    try {
      await retry(() => conn.getLatestBlockhash());
      return true;
    } catch {
      return false;
    }
  }

export async function getLatestBlockhash(): Promise<BlockhashWithExpiryBlockHeight> {
    const conn = getSolanaConnection();
  
    return retry(() =>
      conn.getLatestBlockhash("confirmed")
    );
  }
  