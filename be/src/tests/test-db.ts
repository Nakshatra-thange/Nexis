import { prisma } from "../database/prisma";

async function main() {
  const sessions = await prisma.session.findMany();
  console.log("Sessions:", sessions);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
