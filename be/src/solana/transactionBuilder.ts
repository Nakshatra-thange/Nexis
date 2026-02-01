
import { getSolanaConnection } from "./connection";
import {
    SystemProgram,
    Transaction,
    PublicKey,
  } from "@solana/web3.js";
  
const LAMPORTS_PER_SOL = 1_000_000_000;
const ESTIMATED_FEE_LAMPORTS = 5000;

/** Validate Solana address */
export function validateSolanaAddress(address: string): PublicKey {
  let pubkey: PublicKey;

  try {
    pubkey = new PublicKey(address);
  } catch {
    throw new Error("Invalid Solana address format");
  }

  if (!PublicKey.isOnCurve(pubkey.toBytes())) {
    throw new Error("Solana address is not on curve");
  }

  return pubkey;
}

/** Validate SOL amount */
export function validateAmount(amount: number) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const decimals = amount.toString().split(".")[1];
  if (decimals && decimals.length > 9) {
    throw new Error("Amount exceeds maximum SOL precision (9 decimals)");
  }
}

export async function checkSufficientBalance(
    sender: PublicKey,
    amountSol: number
  ) {
    const connection = getSolanaConnection();
  
    const balanceLamports = await connection.getBalance(sender, "confirmed");
    const requiredLamports =
      amountSol * LAMPORTS_PER_SOL + ESTIMATED_FEE_LAMPORTS;
  
    if (balanceLamports < requiredLamports) {
      throw new Error(
        `Insufficient balance. Required: ${(requiredLamports / LAMPORTS_PER_SOL).toFixed(
          6
        )} SOL`
      );
    }
  }
  


 
  
  
  
  export async function buildUnsignedSolTransfer({
    senderAddress,
    recipientAddress,
    amountSol,
  }: {
    senderAddress: string;
    recipientAddress: string;
    amountSol: number;
  }) {
    // 1. Validate inputs
    validateAmount(amountSol);
  
    const sender = validateSolanaAddress(senderAddress);
    const recipient = validateSolanaAddress(recipientAddress);
  
    // 2. Check balance
    await checkSufficientBalance(sender, amountSol);
  
    // 3. Create transfer instruction
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  
    const instruction = SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports,
    });
  
    // 4. Build transaction
    const connection = getSolanaConnection();
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
  
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: sender,
    }).add(instruction);
  
    // 5. Serialize unsigned transaction
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
  
    return {
      transaction,
      serializedTx: serializedTx.toString("base64"),
      lamports,
    };
  }
  