import { setupSession } from "./setupSession";
import { getTransactionHistoryHandler } from "../mcp/tools/getTransactionHistory";
import { prisma } from "../database/prisma";

const WALLET = "9uZW7DD4DmJUdKjza4thDsQziyEyPWCrtTaAKtMiuhUp";

async function test() {
  await setupSession("history-session", WALLET);

  const result = await getTransactionHistoryHandler({
    sessionId: "history-session",
    limit: 5,
  });

  console.log(result);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
