import { setupSession } from "./setupSession";
import { getBalanceHandler } from "../mcp/tools/getBalance";
import { prisma } from "../database/prisma";

async function test() {
  await setupSession(
    "balance-session",
    "11111111111111111111111111111111"
  );

  const result = await getBalanceHandler({
    sessionId: "balance-session",
  });

  console.log(result);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
