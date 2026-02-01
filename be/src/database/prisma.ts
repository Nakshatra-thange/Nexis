import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString:
    "postgresql://nexis:nexispassword@localhost:5435/nexisdb?schema=public",
});


export const prisma = new PrismaClient({
  adapter,
});
