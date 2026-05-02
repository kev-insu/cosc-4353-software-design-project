const prisma = require("./db");

async function ensureService(data) {
  const name = data.name.trim();
  const existing = await prisma.service.findFirst({ where: { name } });
  if (existing) {
    const q = await prisma.queue.findFirst({ where: { serviceId: existing.id } });
    if (!q) await prisma.queue.create({ data: { serviceId: existing.id } });
    return existing;
  }
  const svc = await prisma.service.create({
    data: {
      name,
      description: data.description,
      duration: data.duration,
      priority: data.priority,
      open: data.open !== false,
    },
  });
  await prisma.queue.create({ data: { serviceId: svc.id } });
  return svc;
}

/** Guarantees the two services integration tests reference by id (1 and 2 when DB is fresh). */
async function ensureCoreServices() {
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
}

module.exports = { ensureCoreServices, ensureService };
