import "dotenv/config";
import { AppError } from "./src/errors/AppError";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./src/logger";
import { getTransactionHistoryHandler } from "./src/mcp/tools/getTransactionHistory";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { checkTransactionHandler } from "./src/mcp/tools/checkTransaction";
import crypto from "node:crypto";
import { cleanupExpiredTransactions } from "./src/jobs/cleanupPendingTx";
import { getBalanceHandler } from "./src/mcp/tools/getBalance";
import { estimateFeeHandler } from "./src/mcp/tools/estimateFee";
import { transferSolHandler } from "./src/mcp/tools/transferSol";

console.error("FRONTEND_URL =", process.env.FRONTEND_URL);
console.error("DATABASE_URL =", process.env.DATABASE_URL);
setInterval(() => {
    cleanupExpiredTransactions().catch(console.error);
  }, 5 * 60 * 1000);
  
/* -------------------------------------------------- */
/* MCP Server Init                                     */
/* -------------------------------------------------- */
const server = new Server(
  {
    name: "nexis-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/* -------------------------------------------------- */
/* tools/list                                          */
/* -------------------------------------------------- */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_balance",
        description:
          "Get the SOL and SPL token balances of the connected wallet. If no wallet is connected, asks the user to connect.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "estimate_fee",
        description:
          "Estimate the Solana network fee for a standard SOL transfer. Does not require input.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "transfer_sol",
        description: "Send SOL to another wallet with user approval.",
        inputSchema: {
          type: "object",
          properties: {
            recipient_address: { type: "string" },
            amount: { type: "number" },
            memo: { type: "string" },
          },
          required: ["recipient_address", "amount"],
          additionalProperties: false,
        },
      },
      {
        name: "check_transaction",
        description: "Check the status of a Solana transaction.",
        inputSchema: {
          type: "object",
          properties: {
            transaction_id: { type: "string" },
          },
          required: ["transaction_id"],
        },
      },
      {
        name: "get_transaction_history",
        description:
          "Show recent confirmed transactions for the connected Solana wallet.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number" },
          },
        },
      },
      
      
    ],
  };
});

/* -------------------------------------------------- */
/* tools/call                                          */
/* -------------------------------------------------- */
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  try {
    const toolName = request.params?.name;

    let sessionId =
      extra.sessionId ||
      (extra.requestInfo?.headers?.["mcp-session-id"] as
        | string
        | undefined);

    logger.info({
      tool: toolName,
      sessionId: sessionId,
    }, "MCP tool called");

    // First contact: generate session ID if missing
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    /* ---------- get_balance ---------- */
    if (toolName === "get_balance") {
      return await getBalanceHandler({ sessionId });
    }

    /* ---------- estimate_fee ---------- */
    if (toolName === "estimate_fee") {
      return await estimateFeeHandler();
    }

    /* ---------- transfer_sol ---------- */
    if (toolName === "transfer_sol") {
      const args = (request.params?.arguments ?? {}) as {
        recipient_address: string;
        amount: number;
        memo?: string;
      };

      return await transferSolHandler({
        
        recipient_address: args.recipient_address,
        amount: args.amount,
        memo: args.memo,
      });
    }

    /* ---------- get_transaction_history ---------- */
    if (toolName === "get_transaction_history") {
      const args = (request.params?.arguments ?? {}) as {
        limit?: number;
      };

      return await getTransactionHistoryHandler({
        sessionId: sessionId!,
        limit: args.limit,
      });
    }

    if (toolName === "check_transaction") {
      const args = (request.params?.arguments ?? {}) as {
        transaction_id: string;
      };

      return checkTransactionHandler({ transaction_id: args.transaction_id });
    }
      

    /* ---------- unknown tool ---------- */
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${toolName}`,
        },
      ],
    };
  } catch (err: any) {
    console.error("MCP error:", err);
  
    if (err instanceof AppError) {
      return {
        content: [{ type: "text", text: err.userMessage }],
        structuredContent: { errorCode: err.code },
      };
    }
  
    return {
      content: [
        {
          type: "text",
          text: "Something went wrong. Please try again.",
        },
      ],
    };
  }
});

/* -------------------------------------------------- */
/* Start MCP                                           */
/* -------------------------------------------------- */
async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep MCP alive
  await new Promise(() => {});
}

start();
