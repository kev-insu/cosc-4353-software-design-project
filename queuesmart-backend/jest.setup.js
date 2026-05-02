const bcrypt = require("bcrypt");
const prisma = require("./db");
const { ensureService } = require("./testFixtures");

beforeAll(async () => {
  await prisma.queueEntry.deleteMany();
  await prisma.history.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.service.deleteMany();
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name IN ('Service','Queue')`);
  await prisma.userCredentials.deleteMany({
    where: { email: { not: "admin@gyukaku.com" } },
  });

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

  await ensureService({
    name: "Standard Seating",
    description: "Regular indoor table seating.",
    duration: 15,
    priority: "medium",
    open: true,
  });
  await ensureService({
    name: "Large Party (6+)",
    description: "Large tables for parties of six or more.",
    duration: 45,
    priority: "high",
    open: true,
  });
});

beforeEach(async () => {
  await prisma.queueEntry.deleteMany();
  await prisma.history.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userCredentials.deleteMany({
    where: { email: { not: "admin@gyukaku.com" } },
  });
  await prisma.service.deleteMany({
    where: { name: { in: ["Bar Seating", "No Priority Service"] } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
