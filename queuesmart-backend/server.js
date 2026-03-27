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
function estimateWaitTime(serviceId, position) {
  const service = services.find(s => s.id === parseInt(serviceId));
  if (!service) return 0;
  
  // Rule-based estimation required by A3 rubric
  return position * service.duration;
}

/* ══════════════════════════════════════════════════════════
   STEP 3: REST API ENDPOINTS
══════════════════════════════════════════════════════════ */

// 4. LOGIN ENDPOINT (Auth Module)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Backend Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Check if it's our hardcoded admin
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    return res.json({ success: true, role: user.role, email: user.email });
  }

  // For Assignment 3, if it's not the admin, we'll treat them as a standard user
  // (In a real app, we'd check if they exist in a DB first)
  return res.json({ success: true, role: "user", email: email });
});

// 1. GET ALL SERVICES (Front-end will call this to populate the Dashboard)
app.get('/api/services', (req, res) => {
  res.json({ success: true, data: services });
});

// 2. JOIN A QUEUE (User Action)
app.post('/api/queue/join', (req, res) => {
  const { serviceId, guestName } = req.body;

  // Backend Validation (Required by A3)
  if (!serviceId || !guestName) {
    return res.status(400).json({ error: "Service ID and Guest Name are required." });
  }

  if (!queues[serviceId]) {
    queues[serviceId] = [];
  }

  // Calculate position
  const position = queues[serviceId].length + 1;
  
  // Step 4 integration: Calculate wait time
  const waitTime = estimateWaitTime(serviceId, position);

  const newEntry = {
    id: Date.now(),
    name: guestName,
    ticket: `T-${ticketCounter++}`,
    status: "Waiting"
  };

  queues[serviceId].push(newEntry);

  res.status(201).json({
    success: true,
    message: `Successfully joined queue.`,
    position: position,
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