const prisma = require("./db");

beforeEach(async () => {
  await prisma.queueEntry.deleteMany();
  await prisma.history.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userCredentials.deleteMany({
    where: { email: { not: "admin@gyukaku.com" } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
