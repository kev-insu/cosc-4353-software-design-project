const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password123', 10);
  await prisma.userCredentials.upsert({
    where: { email: 'admin@gyukaku.com' },
    update: {},
    create: {
      email: 'admin@gyukaku.com',
      password: hashed,
      role: 'admin'
    }
  });
  console.log('Admin user created!');
}

main().then(() => prisma.$disconnect());