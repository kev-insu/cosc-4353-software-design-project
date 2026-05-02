const bcrypt = require("bcrypt");
const prisma = require("./db");
const { ensureService } = require("./testFixtures");

/** Demo tickets — removed and recreated each seed run */
const DEMO_TICKETS = ["QS-DEMO-001", "QS-DEMO-002", "QS-DEMO-003", "QS-DEMO-004"];

async function renumberWaiting(queueId) {
  const waiting = await prisma.queueEntry.findMany({
    where: { queueId, status: "waiting" },
    orderBy: [{ joinTime: "asc" }, { id: "asc" }],
  });
  await prisma.$transaction(
    waiting.map((e, idx) =>
      prisma.queueEntry.update({
        where: { id: e.id },
        data: { position: idx + 1 },
      })
    )
  );
}

/**
 * Duplicate rows often happen when "Standard Seating" (etc.) is added again from the admin UI
 * while the seeded row already exists. Same display name → merge into the oldest id.
 */
async function dedupeServicesByName() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } });
  const groups = new Map();
  for (const s of services) {
    const key = s.name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  let merged = 0;
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const keeper = group[0];
    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      const keepQueue = await prisma.queue.findFirst({ where: { serviceId: keeper.id } });
      const dupQueues = await prisma.queue.findMany({ where: { serviceId: dup.id } });
      if (!keepQueue) continue;

      for (const dq of dupQueues) {
        await prisma.queueEntry.updateMany({
          where: { queueId: dq.id },
          data: { queueId: keepQueue.id },
        });
        await prisma.queue.delete({ where: { id: dq.id } });
      }
      await prisma.service.delete({ where: { id: dup.id } });
      await renumberWaiting(keepQueue.id);
      merged += 1;
    }
  }
  if (merged > 0) {
    console.log(`Merged ${merged} duplicate service row(s) with the same name.`);
  }
}

async function seedDemoQueueAndHistory() {
  await prisma.queueEntry.deleteMany({
    where: { ticket: { in: DEMO_TICKETS } },
  });

  await prisma.history.deleteMany({
    where: { message: { contains: "[seed]" } },
  });

  await prisma.notification.deleteMany({
    where: { message: { startsWith: "[Demo]" } },
  });

  const rows = await prisma.service.findMany({
    orderBy: { id: "asc" },
    take: 2,
    include: { queues: { orderBy: { id: "asc" }, take: 1 } },
  });

  if (rows.length < 1) return;

  const first = rows[0];
  const second = rows[1] || rows[0];
  const q1 = first.queues[0];
  const q2 = second.queues[0];
  if (!q1 || !q2) return;

  await prisma.queueEntry.createMany({
    data: [
      {
        guestName: "Maria Santos",
        ticket: "QS-DEMO-001",
        position: 1,
        queueId: q1.id,
        status: "waiting",
      },
      {
        guestName: "James Okoye",
        ticket: "QS-DEMO-002",
        position: 1,
        queueId: q2.id,
        status: "waiting",
      },
      {
        guestName: "Priya Sharma",
        ticket: "QS-DEMO-003",
        position: 2,
        queueId: q2.id,
        status: "waiting",
      },
      {
        guestName: "Alex Kim",
        ticket: "QS-DEMO-004",
        position: 1,
        queueId: q1.id,
        status: "served",
        joinTime: new Date(Date.now() - 7200000),
      },
    ],
  });

  await renumberWaiting(q1.id);
  await renumberWaiting(q2.id);

  await prisma.history.createMany({
    data: [
      {
        message: `[seed] ${first.name}: Maria joined`,
        action: "joined",
        guestName: "Maria Santos",
        ticket: "QS-DEMO-001",
        serviceId: first.id,
        serviceName: first.name,
      },
      {
        message: `[seed] Alex was served at ${first.name}`,
        action: "served",
        guestName: "Alex Kim",
        ticket: "QS-DEMO-004",
        serviceId: first.id,
        serviceName: first.name,
      },
      {
        message: `[seed] ${second.name}: guests in line`,
        action: "joined",
        guestName: "James Okoye",
        ticket: "QS-DEMO-002",
        serviceId: second.id,
        serviceName: second.name,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        message: "[Demo] Queue is active — staff will call your ticket when your table is ready.",
        type: "info",
      },
      {
        message:
          "[Demo] Seeing two ‘Standard Seating’ rows? That was duplicate DB rows; run seed again or avoid creating the same name twice in admin.",
        type: "warn",
      },
    ],
  });

  console.log("Demo queue entries, history, and notifications inserted.");
}

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

  await dedupeServicesByName();

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

  await ensureService({
    name: "Outdoor Patio",
    description: "Al fresco dining on the patio deck.",
    duration: 20,
    priority: "low",
    open: true,
  });

  console.log("Core services ensured.");

  await seedDemoQueueAndHistory();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
