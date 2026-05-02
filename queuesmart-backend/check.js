// check.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.userCredentials.findMany();
  console.log(users);
}

main().then(() => prisma.$disconnect());