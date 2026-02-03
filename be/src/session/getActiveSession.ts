import { prisma } from "../database/prisma";

export async function getActiveSession() {
  return prisma.session.findFirst({
    where: {
      status: "connected",
      wallet_address: { not: null },
    },
    orderBy: { created_at: "desc" },
  });
}
