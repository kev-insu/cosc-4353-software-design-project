// server.js
const { estimateWaitTime } = require('./queueLogic');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Allows your React app to talk to this server
app.use(express.json()); // Allows the server to read JSON bodies

/* ══════════════════════════════════════════════════════════
   SEED DATA (In-Memory "Database")
══════════════════════════════════════════════════════════ */
let services = [
  { id: 1, name: "Standard Seating", duration: 15, priority: "medium", open: true },
  { id: 2, name: "Large Party (6+)", duration: 45, priority: "high", open: true }
];

// Queues mapped by service ID
let queues = {
  1: [
    { id: 101, name: "Maria Santos", ticket: "A-001", status: "Waiting" }
  ],
  2: []
};

let ticketCounter = 2; // Simple counter to generate unique ticket numbers
// Mock User Database (A3 In-Memory Requirement)
let users = [
  { email: "admin@gyukaku.com", password: "password123", role: "admin" }
];

/* ══════════════════════════════════════════════════════════
   STEP 4: WAIT-TIME ESTIMATION LOGIC (The Math)
   Formula: Estimated Wait = Position * Expected Duration
══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   STEP 3: REST API ENDPOINTS
══════════════════════════════════════════════════════════ */

// 4. LOGIN ENDPOINT (Auth Module)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password must be strings." });
  }

  if (email.length < 5 || email.length > 100) {
    return res.status(400).json({ error: "Email must be between 5 and 100 characters." });
  }

  if (password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: "Password must be between 6 and 50 characters." });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    return res.json({ success: true, role: user.role, email: user.email });
  }

  return res.status(401).json({ error: "Invalid email or password." });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password must be strings." });
  }

  if (email.length < 5 || email.length > 100) {
    return res.status(400).json({ error: "Email must be between 5 and 100 characters." });
  }

  if (password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: "Password must be between 6 and 50 characters." });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists." });
  }

  const newUser = {
    email,
    password,
    role: "user"
  };

  users.push(newUser);

  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    role: newUser.role,
    email: newUser.email
  });
});

// 1. GET ALL SERVICES (Front-end will call this to populate the Dashboard)
app.get('/api/services', (req, res) => {
  res.json({ success: true, data: services });
});

// 2. JOIN A QUEUE (User Action)
app.post('/api/queue/join', (req, res) => {
  const { serviceId, guestName } = req.body;

  if (!serviceId || !guestName) {
    return res.status(400).json({ error: "Service ID and Guest Name are required." });
  }

  if (typeof guestName !== "string") {
    return res.status(400).json({ error: "Guest Name must be a string." });
  }

  if (guestName.trim().length < 2 || guestName.trim().length > 50) {
    return res.status(400).json({ error: "Guest Name must be between 2 and 50 characters." });
  }

  const service = services.find(s => s.id === parseInt(serviceId));
  if (!service) {
    return res.status(404).json({ error: "Service not found." });
  }

  if (!queues[serviceId]) {
    queues[serviceId] = [];
  }

  const position = queues[serviceId].length + 1;
  const waitTime = estimateWaitTime(service, position);

  const newEntry = {
    id: Date.now(),
    name: guestName.trim(),
    ticket: `T-${ticketCounter++}`,
    status: "Waiting"
  };

  queues[serviceId].push(newEntry);

  res.status(201).json({
    success: true,
    message: "Successfully joined queue.",
    position,
    estimatedWaitMinutes: waitTime,
    ticket: newEntry.ticket
  });
});

// 3. SERVE NEXT USER (Admin Action)
app.post('/api/queue/serve', (req, res) => {
  const { serviceId } = req.body;

  if (!queues[serviceId] || queues[serviceId].length === 0) {
    return res.status(400).json({ error: "Queue is empty or does not exist." });
  }

  // FIFO Logic: Remove the first person in the array
  const servedGuest = queues[serviceId].shift();

  res.json({
    success: true,
    message: `Served ${servedGuest.name}`,
    remainingInQueue: queues[serviceId].length
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`QueueSmart Backend running on http://localhost:${PORT}`);
});
