// server.js
const crypto = require("crypto");
const prisma = require("./db");
const bcrypt = require("bcrypt");
const { generateReport, toCsv } = require("./reportService");

const { estimateWaitTime } = require("./queueLogic");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("QueueSmart Backend is live and connected to SQLite!");
});

function isAdministratorRole(role) {
  return ["admin", "administrator"].includes(String(role || "").trim().toLowerCase());
}

function requireAdmin(req, res, next) {
  const role = req.get("x-user-role");
  if (!role) {
    return res.status(401).json({ error: "Administrator access is required." });
  }
  if (!isAdministratorRole(role)) {
    return res.status(403).json({ error: "Administrator access is required." });
  }
  return next();
}

function validateEmailPasswordPresence(email, password, res) {
  if (email === undefined || email === null || email === "") {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password === undefined || password === null || password === "") {
    return res.status(400).json({ error: "Email and password are required." });
  }
  return null;
}

function validateLoginEmailPassword(email, password, res) {
  const miss = validateEmailPasswordPresence(email, password, res);
  if (miss) return miss;
  const em = String(email).trim();
  const pw = String(password);
  if (em.length < 5 || em.length > 100) {
    return res.status(400).json({ error: "Email must be between 5 and 100 characters." });
  }
  if (pw.length < 6 || pw.length > 50) {
    return res.status(400).json({ error: "Password must be between 6 and 50 characters." });
  }
  return null;
}

function validateRegisterBody(body, res) {
  const { email, password } = body || {};
  if (email === undefined || email === null || email === "") {
    return res.status(400).json({ error: "Email is required." });
  }
  if (password === undefined || password === null || password === "") {
    return res.status(400).json({ error: "Password is required." });
  }
  const pw = String(password);
  if (pw.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  return null;
}

const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

function validateServiceCreateBody(body, res) {
  const { name, description, duration, priority } = body || {};
  if (name === undefined || name === null || String(name).trim() === "") {
    return res.status(400).json({ error: "Service name is required." });
  }
  if (String(name).trim().length > 100) {
    return res.status(400).json({ error: "Service name must be 100 characters or fewer." });
  }
  if (description === undefined || description === null || String(description).trim() === "") {
    return res.status(400).json({ error: "Description is required." });
  }
  if (duration === undefined || duration === null || duration === "") {
    return res.status(400).json({ error: "Duration is required." });
  }
  const dur = Number(duration);
  if (Number.isNaN(dur) || !Number.isInteger(dur) || dur <= 0 || dur > 480) {
    return res.status(400).json({ error: "Duration must be a whole number between 1 and 480." });
  }
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.has(String(priority))) {
    return res.status(400).json({ error: "Priority must be low, medium, or high." });
  }
  return null;
}

async function trimNotificationsTo50() {
  const keep = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true },
  });
  if (!keep.length) return;
  const keepIds = keep.map((k) => k.id);
  await prisma.notification.deleteMany({ where: { id: { notIn: keepIds } } });
}

async function pushNotification(message, type = "info") {
  await prisma.notification.create({ data: { message, type } });
  await trimNotificationsTo50();
}

async function generateUniqueTicket() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ticket = `QS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const exists = await prisma.queueEntry.findUnique({ where: { ticket }, select: { id: true } });
    if (!exists) return ticket;
  }
  throw new Error("Could not allocate a unique ticket.");
}

async function renumberWaitingPositions(queueId) {
  const waiting = await prisma.queueEntry.findMany({
    where: { queueId, status: "waiting" },
    orderBy: [{ joinTime: "asc" }, { id: "asc" }],
  });
  await prisma.$transaction(
    waiting.map((entry, index) =>
      prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: index + 1 },
      })
    )
  );
}

async function servicesWithQueueCounts() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } });
  const result = await Promise.all(
    services.map(async (s) => {
      const waiting = await prisma.queueEntry.count({
        where: { status: "waiting", queue: { serviceId: s.id } },
      });
      return {
        ...s,
        currentQueue: waiting,
        queueLength: waiting,
      };
    })
  );
  return result;
}

function mapQueueEntryForClient(entry, service, indexOneBased) {
  const pos = indexOneBased;
  return {
    id: entry.id,
    guestName: entry.guestName,
    name: entry.guestName,
    ticket: entry.ticket,
    joinedAt: entry.joinTime.getTime(),
    joinTime: entry.joinTime.toISOString(),
    joined: entry.joinTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: entry.status,
    position: pos,
    estimatedWaitMinutes: estimateWaitTime(service, pos),
  };
}

/* ══════════════════════════════════════════════════════════
   AUTH ENDPOINTS
══════════════════════════════════════════════════════════ */

app.post("/api/auth/login", async (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;
  const v = validateLoginEmailPassword(rawEmail, rawPassword, res);
  if (v) return v;

  const email = String(rawEmail).trim();
  const password = String(rawPassword);

  try {
    const user = await prisma.userCredentials.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });

    res.json({ success: true, role: user.role, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const v = validateRegisterBody(req.body, res);
  if (v) return v;

  const email = String(req.body.email).trim();
  const password = String(req.body.password);

  try {
    const existingUser = await prisma.userCredentials.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.userCredentials.create({
      data: {
        email,
        password: hashedPassword,
        role: "user",
      },
    });

    res.status(201).json({ success: true, email: newUser.email, role: newUser.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE ENDPOINTS
══════════════════════════════════════════════════════════ */

app.get("/api/services", async (req, res) => {
  try {
    const data = await servicesWithQueueCounts();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: "Error fetching services" });
  }
});

app.post("/api/services", async (req, res) => {
  const v = validateServiceCreateBody(req.body, res);
  if (v) return v;

  const { name, description, duration, priority } = req.body;
  const prio = priority !== undefined && priority !== null ? String(priority) : "medium";

  try {
    const newService = await prisma.service.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        duration: parseInt(duration, 10),
        priority: VALID_PRIORITIES.has(prio) ? prio : "medium",
      },
    });
    await prisma.queue.create({ data: { serviceId: newService.id } });
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating service" });
  }
});

app.put("/api/services/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid service id." });
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Service not found." });
  }

  const { name, description, duration, priority, open } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ error: "Service name cannot be empty." });
    }
    if (String(name).trim().length > 100) {
      return res.status(400).json({ error: "Service name must be 100 characters or fewer." });
    }
  }

  if (duration !== undefined) {
    const dur = Number(duration);
    if (Number.isNaN(dur) || dur <= 0 || !Number.isInteger(dur) || dur > 480) {
      return res.status(400).json({ error: "Duration must be a whole number between 1 and 480." });
    }
  }

  if (priority !== undefined) {
    if (!VALID_PRIORITIES.has(String(priority))) {
      return res.status(400).json({ error: "Priority must be low, medium, or high." });
    }
  }

  try {
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = String(description).trim();
    if (duration !== undefined) data.duration = Number(duration);
    if (priority !== undefined) data.priority = String(priority);
    if (open !== undefined) data.open = Boolean(open);

    const updated = await prisma.service.update({
      where: { id },
      data,
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating service." });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid service id." });
  }
  try {
    await prisma.service.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service not found." });
    }
    console.error(error);
    return res.status(500).json({ error: "Error deleting service." });
  }
});

/* ══════════════════════════════════════════════════════════
   QUEUE ENDPOINTS
══════════════════════════════════════════════════════════ */

app.get("/api/queue/:serviceId", async (req, res) => {
  const serviceId = parseInt(req.params.serviceId, 10);
  if (Number.isNaN(serviceId)) {
    return res.status(400).json({ error: "Invalid service id." });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  const entries = await prisma.queueEntry.findMany({
    where: { status: "waiting", queue: { serviceId } },
    orderBy: [{ position: "asc" }, { joinTime: "asc" }],
  });

  const queueWithEstimates = entries.map((guest, index) => mapQueueEntryForClient(guest, service, index + 1));

  return res.json({
    success: true,
    serviceName: service.name,
    count: entries.length,
    data: queueWithEstimates,
  });
});

app.post("/api/queue/join", async (req, res) => {
  const { serviceId, guestName } = req.body || {};

  if (serviceId === undefined || serviceId === null || serviceId === "") {
    return res.status(400).json({ error: "Service ID is required." });
  }
  if (guestName === undefined || guestName === null || String(guestName).trim() === "") {
    return res.status(400).json({ error: "Guest name is required." });
  }

  const trimmedName = String(guestName).trim();
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return res.status(400).json({ error: "Guest name must be between 2 and 50 characters." });
  }

  const sid = parseInt(serviceId, 10);
  if (Number.isNaN(sid)) {
    return res.status(400).json({ error: "Service ID is required." });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: sid } });
    if (!service) {
      return res.status(404).json({ error: "Service not found." });
    }

    const queue = await prisma.queue.findFirst({ where: { serviceId: sid } });
    if (!queue) return res.status(404).json({ error: "Queue not found" });

    const currentCount = await prisma.queueEntry.count({
      where: { queueId: queue.id, status: "waiting" },
    });

    const ticket = await generateUniqueTicket();

    const entry = await prisma.queueEntry.create({
      data: {
        guestName: trimmedName,
        ticket,
        position: currentCount + 1,
        queueId: queue.id,
      },
    });

    await prisma.history.create({
      data: {
        message: `${trimmedName} joined the queue for service ${service.name}`,
        action: "joined",
        guestName: trimmedName,
        ticket: entry.ticket,
        serviceId: service.id,
        serviceName: service.name,
      },
    });

    await pushNotification(`${trimmedName} joined the queue.`, "info");

    const estimatedWaitMinutes = estimateWaitTime(service, entry.position);

    res.status(201).json({
      success: true,
      data: entry,
      ticket: entry.ticket,
      position: entry.position,
      estimatedWaitMinutes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error joining queue" });
  }
});

app.post("/api/queue/leave", async (req, res) => {
  const { serviceId, ticket } = req.body || {};

  if (serviceId === undefined || serviceId === null || serviceId === "") {
    return res.status(400).json({ error: "Service ID and ticket are required." });
  }
  if (!ticket) {
    return res.status(400).json({ error: "Service ID and ticket are required." });
  }

  const sid = parseInt(serviceId, 10);
  if (Number.isNaN(sid)) {
    return res.status(404).json({ error: "Service not found." });
  }

  const service = await prisma.service.findUnique({ where: { id: sid } });
  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  const entry = await prisma.queueEntry.findFirst({
    where: {
      ticket: String(ticket),
      status: "waiting",
      queue: { serviceId: sid },
    },
    include: { queue: true },
  });

  if (!entry) {
    return res.status(404).json({ error: "Ticket not found in this queue." });
  }

  await prisma.queueEntry.update({
    where: { id: entry.id },
    data: { status: "canceled" },
  });

  await renumberWaitingPositions(entry.queueId);

  const remainingInQueue = await prisma.queueEntry.count({
    where: { queueId: entry.queueId, status: "waiting" },
  });

  await prisma.history.create({
    data: {
      message: `${entry.guestName} left the queue for ${service.name}`,
      action: "left",
      guestName: entry.guestName,
      ticket: entry.ticket,
      serviceId: service.id,
      serviceName: service.name,
    },
  });

  await pushNotification(`${entry.guestName} (${entry.ticket}) left ${service.name}.`, "warn");

  return res.json({
    success: true,
    message: `${entry.guestName} has left the queue.`,
    remainingInQueue,
  });
});

app.post("/api/queue/serve", async (req, res) => {
  const { serviceId } = req.body || {};

  if (serviceId === undefined || serviceId === null || serviceId === "") {
    return res.status(400).json({ error: "Service ID is required." });
  }

  const sid = parseInt(serviceId, 10);
  if (Number.isNaN(sid)) {
    return res.status(400).json({ error: "Queue is empty or does not exist." });
  }

  const queue = await prisma.queue.findFirst({ where: { serviceId: sid } });
  if (!queue) {
    return res.status(400).json({ error: "Queue is empty or does not exist." });
  }

  const next = await prisma.queueEntry.findFirst({
    where: { queueId: queue.id, status: "waiting" },
    orderBy: [{ position: "asc" }, { joinTime: "asc" }],
  });

  if (!next) {
    return res.status(400).json({ error: "Queue is empty or does not exist." });
  }

  const service = await prisma.service.findUnique({ where: { id: sid } });

  await prisma.queueEntry.update({
    where: { id: next.id },
    data: { status: "served" },
  });

  await renumberWaitingPositions(queue.id);

  const remainingInQueue = await prisma.queueEntry.count({
    where: { queueId: queue.id, status: "waiting" },
  });

  await prisma.history.create({
    data: {
      message: `${next.guestName} was served at ${service?.name || "Unknown"}`,
      action: "served",
      guestName: next.guestName,
      ticket: next.ticket,
      serviceId: sid,
      serviceName: service?.name || "Unknown",
    },
  });

  const servedGuest = {
    id: next.id,
    name: next.guestName,
    guestName: next.guestName,
    ticket: next.ticket,
    status: "served",
  };

  await pushNotification(`${next.guestName} (${next.ticket}) has been seated.`, "success");

  if (remainingInQueue > 0) {
    const nextGuest = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id, status: "waiting" },
      orderBy: [{ position: "asc" }, { joinTime: "asc" }],
    });
    if (nextGuest) {
      await pushNotification(
        `${nextGuest.guestName} (${nextGuest.ticket}) — you're next! Please be ready.`,
        "success"
      );
    }
  }

  return res.json({
    success: true,
    message: `Served ${next.guestName}`,
    servedGuest,
    remainingInQueue,
  });
});

app.put("/api/queue/:serviceId/order", async (req, res) => {
  const serviceId = parseInt(req.params.serviceId, 10);
  const { orderedEntryIds } = req.body || {};

  if (Number.isNaN(serviceId)) {
    return res.status(400).json({ error: "Invalid service id." });
  }
  if (!Array.isArray(orderedEntryIds) || orderedEntryIds.length === 0) {
    return res.status(400).json({ error: "orderedEntryIds must be a non-empty array." });
  }

  const queue = await prisma.queue.findFirst({ where: { serviceId } });
  if (!queue) {
    return res.status(404).json({ error: "Queue not found." });
  }

  const ids = orderedEntryIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
  const entries = await prisma.queueEntry.findMany({
    where: {
      queueId: queue.id,
      status: "waiting",
      id: { in: ids },
    },
  });

  if (entries.length !== ids.length) {
    return res.status(400).json({ error: "Invalid entry ids for this queue." });
  }

  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    return res.status(400).json({ error: "Duplicate entry ids." });
  }

  await prisma.$transaction(
    ids.map((entryId, index) =>
      prisma.queueEntry.update({
        where: { id: entryId },
        data: { position: index + 1 },
      })
    )
  );

  return res.json({ success: true });
});

/* ══════════════════════════════════════════════════════════
   NOTIFICATION & HISTORY
══════════════════════════════════════════════════════════ */

app.get("/api/notifications", async (req, res) => {
  try {
    const rows = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json({
      success: true,
      data: rows.map((n) => ({
        id: n.id,
        message: n.message,
        type: n.type,
        time: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error loading notifications." });
  }
});

app.get("/api/history", async (req, res) => {
  const { ticket, guestName } = req.query;

  try {
    const where = {};
    if (ticket) {
      where.ticket = String(ticket);
    }
    if (guestName) {
      where.guestName = { contains: String(guestName) };
    }

    const rows = await prisma.history.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    const data = rows.map((h) => ({
      id: h.id,
      guestName: h.guestName,
      ticket: h.ticket,
      action: h.action,
      serviceId: h.serviceId,
      serviceName: h.serviceName,
      message: h.message,
      time: h.timestamp.toISOString(),
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error loading history." });
  }
});

/* ══════════════════════════════════════════════════════════
   REPORTS (Admin)
══════════════════════════════════════════════════════════ */
app.get("/api/reports/options", requireAdmin, async (req, res) => {
  try {
    const serviceRows = await prisma.service.findMany({
      include: { queues: true },
      orderBy: { name: "asc" },
    });

    const queuesForFilters = serviceRows.flatMap((service) =>
      service.queues.map((queue) => ({
        id: queue.id,
        name: `Queue ${queue.id}`,
        serviceId: service.id,
        serviceName: service.name,
        status: queue.status,
      }))
    );

    const statusRows = await prisma.queueEntry.findMany({
      distinct: ["status"],
      select: { status: true },
      orderBy: { status: "asc" },
    });

    return res.json({
      success: true,
      data: {
        services: serviceRows.map((service) => ({ id: service.id, name: service.name })),
        queues: queuesForFilters,
        statuses: statusRows.map((row) => row.status),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error loading report filters." });
  }
});

app.get("/api/reports/:reportType/export", requireAdmin, async (req, res) => {
  try {
    const report = await generateReport(prisma, req.params.reportType, req.query);
    const fileDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.reportType}-${fileDate}.csv"`
    );
    return res.send(toCsv(report.columns, report.rows));
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Error exporting report.",
    });
  }
});

app.get("/api/reports/:reportType", requireAdmin, async (req, res) => {
  try {
    const report = await generateReport(prisma, req.params.reportType, req.query);
    return res.json({ success: true, reportType: req.params.reportType, ...report });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Error generating report.",
    });
  }
});

const PORT = 3000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`QueueSmart Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
