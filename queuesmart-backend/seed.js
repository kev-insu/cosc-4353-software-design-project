const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);
  await prisma.userCredentials.upsert({
    where: { email: "admin@gyukaku.com" },
    update: {},
    create: {
      email: "admin@gyukaku.com",
      password: hashed,
      role: "admin",
    },
  });
  console.log("Admin user ensured.");

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const s1 = await prisma.service.create({
      data: {
        name: "Standard Seating",
        description: "Regular indoor table seating.",
        duration: 15,
        priority: "medium",
        open: true,
      },
    });
    await prisma.queue.create({ data: { serviceId: s1.id } });

    const s2 = await prisma.service.create({
      data: {
        name: "Large Party (6+)",
        description: "Large tables for parties of six or more.",
        duration: 45,
        priority: "high",
        open: true,
      },
    });
    await prisma.queue.create({ data: { serviceId: s2.id } });
    console.log("Default services and queues created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
