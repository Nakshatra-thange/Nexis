import { prisma } from "../database/prisma";

export async function cleanupExpiredTransactions() {
  await prisma.pendingTransaction.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });
}
