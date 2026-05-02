// server.js
const prisma = require('./db');
const bcrypt = require('bcrypt');
const { generateReport, toCsv } = require('./reportService');

const { estimateWaitTime } = require('./queueLogic');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('QueueSmart Backend is live and connected to SQLite!');
});

/* ══════════════════════════════════════════════════════════
   SEED DATA (In-Memory "Database")
══════════════════════════════════════════════════════════ */
let services = [
  { id: 1, name: "Standard Seating", duration: 15, priority: "medium", open: true },
  { id: 2, name: "Large Party (6+)", duration: 45, priority: "high", open: true }
];

let queues = {
  1: [
    { id: 101, name: "Maria Santos", ticket: "A-001", joinedAt: Date.now(), status: "Waiting" }
  ],
  2: []
};

let ticketCounter = 2;

// Notification log (in-memory)
let notifications = [];

// History log (in-memory)
let history = [];

/* ══════════════════════════════════════════════════════════
   HELPER: PUSH A NOTIFICATION
══════════════════════════════════════════════════════════ */
function pushNotification(message, type = "info") {
  const note = {
    id: Date.now() + Math.random(),
    message,
    type,
    time: new Date().toISOString()
  };
  notifications.unshift(note);
  // Keep only the last 50 notifications
  if (notifications.length > 50) notifications.pop();
  return note;
}

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

/* ══════════════════════════════════════════════════════════
   AUTH ENDPOINTS
══════════════════════════════════════════════════════════ */

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.userCredentials.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    // Compare the plain text password with the encrypted hash in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });

    res.json({ success: true, role: user.role, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.userCredentials.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists." });

    // 2. Encrypt the password (Salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save to SQLite
    const newUser = await prisma.userCredentials.create({
      data: {
        email,
        password: hashedPassword,
        role: "user"
      }
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

// GET ALL SERVICES
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ error: "Error fetching services" });
  }
});

// CREATE SERVICE
app.post('/api/services', async (req, res) => {
  const { name, description, duration, priority } = req.body;
  try {
    const newService = await prisma.service.create({
      data: { name, description, duration: parseInt(duration), priority }
    });
    // A4 requirement: Create the initial queue for this service
    await prisma.queue.create({ data: { serviceId: newService.id } });
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ error: "Error creating service" });
  }
});

// UPDATE A SERVICE (Admin)
app.put('/api/services/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const serviceIndex = services.findIndex(s => s.id === id);

  if (serviceIndex === -1) {
    return res.status(404).json({ error: "Service not found." });
  }

  const { name, description, duration, priority } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ error: "Service name cannot be empty." });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: "Service name must be 100 characters or fewer." });
    }
  }

  if (duration !== undefined) {
    const dur = Number(duration);
    if (isNaN(dur) || dur <= 0 || !Number.isInteger(dur) || dur > 480) {
      return res.status(400).json({ error: "Duration must be a whole number between 1 and 480." });
    }
  }

  if (priority !== undefined) {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Priority must be low, medium, or high." });
    }
  }

  services[serviceIndex] = {
    ...services[serviceIndex],
    ...(name      !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(duration  !== undefined && { duration: Number(duration) }),
    ...(priority  !== undefined && { priority })
  };

  return res.json({ success: true, data: services[serviceIndex] });
});

/* ══════════════════════════════════════════════════════════
   QUEUE ENDPOINTS
══════════════════════════════════════════════════════════ */

// GET CURRENT QUEUE FOR A SERVICE (Admin)
app.get('/api/queue/:serviceId', (req, res) => {
  const serviceId = parseInt(req.params.serviceId);
  const service = services.find(s => s.id === serviceId);

  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  const queue = queues[serviceId] || [];

  // Attach position and estimated wait to each entry
  const queueWithEstimates = queue.map((guest, index) => ({
    ...guest,
    position: index + 1,
    estimatedWaitMinutes: estimateWaitTime(service, index + 1)
  }));

  return res.json({
    success: true,
    serviceName: service.name,
    count: queue.length,
    data: queueWithEstimates
  });
});

// JOIN A QUEUE (User)
// JOIN QUEUE
app.post('/api/queue/join', async (req, res) => {
  const { serviceId, guestName } = req.body;

  try {
    // 1. Find the active queue for this service
    const queue = await prisma.queue.findFirst({ where: { serviceId: parseInt(serviceId) } });
    if (!queue) return res.status(404).json({ error: "Queue not found" });

    // 2. Count how many people are already waiting to determine position
    const currentCount = await prisma.queueEntry.count({
      where: { queueId: queue.id, status: "waiting" }
    });

    // 3. Create the entry
    const entry = await prisma.queueEntry.create({
      data: {
        guestName,
        ticket: `QS-${Math.floor(Math.random() * 9000) + 1000}`,
        position: currentCount + 1,
        queueId: queue.id
      }
    });

    // 4. Log to History (Rubric Requirement 6)
    await prisma.history.create({
      data: { message: `${guestName} joined the queue for service ${serviceId}` }
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error joining queue" });
  }
});

// LEAVE A QUEUE (User)
app.post('/api/queue/leave', (req, res) => {
  const { serviceId, ticket } = req.body;

  if (!serviceId || !ticket) {
    return res.status(400).json({ error: "Service ID and ticket are required." });
  }

  const service = services.find(s => s.id === parseInt(serviceId));
  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  if (!queues[serviceId]) {
    return res.status(404).json({ error: "Queue not found." });
  }

  const guestIndex = queues[serviceId].findIndex(g => g.ticket === ticket);
  if (guestIndex === -1) {
    return res.status(404).json({ error: "Ticket not found in this queue." });
  }

  const [removedGuest] = queues[serviceId].splice(guestIndex, 1);

  // Trigger notification
  pushNotification(
    `${removedGuest.name} (${ticket}) left ${service.name}.`,
    "warn"
  );

  // Add to history
  history.unshift({
    id: Date.now(),
    guestName: removedGuest.name,
    ticket: removedGuest.ticket,
    serviceName: service.name,
    serviceId: service.id,
    action: "left",
    time: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `${removedGuest.name} has left the queue.`,
    remainingInQueue: queues[serviceId].length
  });
});

// SERVE NEXT USER (Admin)
app.post('/api/queue/serve', (req, res) => {
  const { serviceId } = req.body;

  if (!serviceId) {
    return res.status(400).json({ error: "Service ID is required." });
  }

  if (!queues[serviceId] || queues[serviceId].length === 0) {
    return res.status(400).json({ error: "Queue is empty or does not exist." });
  }

  const servedGuest = queues[serviceId].shift();

  // Check if next guest is close to being served — notify them
  if (queues[serviceId].length > 0) {
    const nextGuest = queues[serviceId][0];
    pushNotification(
      `${nextGuest.name} (${nextGuest.ticket}) — you're next! Please be ready.`,
      "success"
    );
  }

  // Trigger notification for the served guest
  pushNotification(
    `${servedGuest.name} (${servedGuest.ticket}) has been seated.`,
    "success"
  );

  // Add to history
  history.unshift({
    id: Date.now(),
    guestName: servedGuest.name,
    ticket: servedGuest.ticket,
    serviceName: (services.find(s => s.id === parseInt(serviceId)) || {}).name || "Unknown",
    serviceId: parseInt(serviceId),
    action: "served",
    time: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Served ${servedGuest.name}`,
    servedGuest,
    remainingInQueue: queues[serviceId].length
  });
});

/* ══════════════════════════════════════════════════════════
   NOTIFICATION ENDPOINT
══════════════════════════════════════════════════════════ */

// GET ALL NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  return res.json({ success: true, data: notifications });
});

/* ══════════════════════════════════════════════════════════
   HISTORY ENDPOINT
══════════════════════════════════════════════════════════ */

// GET HISTORY (optionally filter by guestName or ticket via query param)
app.get('/api/history', (req, res) => {
  const { ticket, guestName } = req.query;

  let result = history;

  if (ticket) {
    result = result.filter(h => h.ticket === ticket);
  }
  if (guestName) {
    result = result.filter(h =>
      h.guestName.toLowerCase().includes(guestName.toLowerCase())
    );
  }

  return res.json({ success: true, count: result.length, data: result });
});

/* ══════════════════════════════════════════════════════════
   START SERVER
══════════════════════════════════════════════════════════ */
// REPORTS (Admin)
app.get('/api/reports/options', requireAdmin, async (req, res) => {
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

app.get('/api/reports/:reportType/export', requireAdmin, async (req, res) => {
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

app.get('/api/reports/:reportType', requireAdmin, async (req, res) => {
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
app.listen(PORT, () => {
  console.log(`QueueSmart Backend running on http://localhost:${PORT}`);
});

module.exports = app; // export for testing
