import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import app from "./src/api/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  getBalanceInputSchema,
  getBalanceHandler,
} from "./src/mcp/tools/getBalance";
import { prisma } from "./src/database/prisma";
import { getSolanaConnection } from "./src/solana/connection";
async function startupChecks() {
  // DB
  await prisma.$queryRaw`SELECT 1`;

  // Solana RPC
  const conn = getSolanaConnection();
  await conn.getLatestBlockhash();

  console.log("✅ Startup checks passed");
}
const PORT = process.env.PORT || 3001;
function log(message: string) {
  console.log(`[NEXIS MCP] ${new Date().toISOString()} — ${message}`);
}
const port = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
const server = new Server(
  {
    name: "nexis-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {}, // leave empty
  }
);
server.setRequestHandler(
  getBalanceInputSchema,
  async (request: any) => {
    return getBalanceHandler({
      sessionId: request.sessionId,
    });
  }
);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// ===== Start Server =====
async function start() {
  try {
    log("Starting Nexis MCP Server...");
    

    const transport = new StdioServerTransport();
    await server.connect(transport);

    log("MCP Server running via STDIO transport ✅");
  } catch (error) {
    console.error("Failed to start MCP Server:", error);
    process.exit(1);
  }
}


start();
