import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});
await prisma.session.upsert({
  where: { session_id: "pending-session" },
  update: {
    wallet_address: null,
    status: "pending",
  },
  create: {
    session_id: "pending-session",
    connection_token: "pendingtoken",
    token_expiry: new Date(Date.now() + 10 * 60 * 1000),
    status: "pending",
  },
});
await prisma.session.upsert({
  where: { session_id: "expired-session" },
  update: {
    token_expiry: new Date(Date.now() - 1000),
    status: "pending",
  },
  create: {
    session_id: "expired-session",
    connection_token: "expiredtoken",
    token_expiry: new Date(Date.now() - 1000),
    status: "pending",
  },
});
