import {
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction,
  } from "@solana/web3.js";
  import { getSolanaConnection } from "../../solana/connection";
  import { AppError } from "../../errors/AppError";
  import { rateLimit } from "../../security/rateLimiter";
import { limits } from "../../security/limits";

  export async function estimateFeeHandler() {
    rateLimit(
      `global:estimate_fee`,
      limits.global,
      "global"
    );
    
    // Solana base fee for a simple transfer (lamports)
    const LAMPORTS_PER_SIGNATURE = 5000;
    const SOL_PER_LAMPORT = 1_000_000_000;
  
    const feeInSol = LAMPORTS_PER_SIGNATURE / SOL_PER_LAMPORT;
    if(!feeInSol){
      throw new AppError(
        "FEE_ESTIMATION_FAILED",
        "Failed to estimate network fee."
      );
    }
  
    return {
      content: [
        {
          type: "text",
          text: `Estimated network fee: ${feeInSol.toFixed(6)} SOL`,
        },
      ],
        
    
    };
  }
  