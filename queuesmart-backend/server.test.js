// server.test.js
// Tests for all backend endpoints and business logic.
// Run with: npm test

const request = require('supertest');
const app = require('./server');
const { estimateWaitTime } = require('./queueLogic');

/* ══════════════════════════════════════════════════════════
   SECTION 1: WAIT-TIME ESTIMATION LOGIC (queueLogic.js)
══════════════════════════════════════════════════════════ */
describe('Wait-Time Estimation Logic', () => {

  test('calculates wait time correctly for standard position', () => {
    const service = { id: 1, name: "Standard Seating", duration: 15 };
    expect(estimateWaitTime(service, 3)).toBe(45); // 3 × 15
  });

  test('calculates wait time for first position', () => {
    const service = { id: 1, duration: 20 };
    expect(estimateWaitTime(service, 1)).toBe(20); // 1 × 20
  });

  test('returns 0 if service is null', () => {
    expect(estimateWaitTime(null, 3)).toBe(0);
  });

  test('returns 0 if service has no duration field', () => {
    expect(estimateWaitTime({ name: "Broken" }, 3)).toBe(0);
  });

  test('returns 0 if position is zero', () => {
    const service = { id: 1, duration: 15 };
    expect(estimateWaitTime(service, 0)).toBe(0);
  });

  test('returns 0 if position is negative', () => {
    const service = { id: 1, duration: 15 };
    expect(estimateWaitTime(service, -5)).toBe(0);
  });

  test('handles large position values correctly', () => {
    const service = { id: 1, duration: 10 };
    expect(estimateWaitTime(service, 100)).toBe(1000);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 2: AUTH — LOGIN
══════════════════════════════════════════════════════════ */
describe('POST /api/auth/login', () => {

  test('logs in with valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gyukaku.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('admin');
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gyukaku.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.statusCode).toBe(401);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gyukaku.com' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when email is too short', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b', password: 'password123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/5 and 100/i);
  });

  test('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gyukaku.com', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/6 and 50/i);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 3: AUTH — REGISTER
══════════════════════════════════════════════════════════ */
describe('POST /api/auth/register', () => {

  test('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@test.com', password: 'mypassword' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('user');
  });

  test('returns 400 if user already exists', async () => {
    // Register once
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'duplicate@test.com', password: 'mypassword' });
    // Try again with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'duplicate@test.com', password: 'mypassword' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'mypassword' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(400);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 4: SERVICES
══════════════════════════════════════════════════════════ */
describe('GET /api/services', () => {

  test('returns the list of services', async () => {
    const res = await request(app).get('/api/services');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

});

describe('POST /api/services', () => {

  test('creates a new service with valid data', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Bar Seating', description: 'Seats at the bar.', duration: 20, priority: 'low' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Bar Seating');
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ description: 'No name.', duration: 20 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  test('returns 400 when name exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'A'.repeat(101), description: 'Too long.', duration: 20 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/100/i);
  });

  test('returns 400 when description is missing', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', duration: 20 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/description/i);
  });

  test('returns 400 when duration is missing', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', description: 'Valid desc.' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/duration/i);
  });

  test('returns 400 when duration is not a whole number', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', description: 'Valid desc.', duration: 15.5 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when duration exceeds 480', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', description: 'Valid desc.', duration: 500 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when priority is invalid', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', description: 'Valid desc.', duration: 20, priority: 'urgent' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });

  test('defaults priority to medium if not provided', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'No Priority Service', description: 'Test.', duration: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.priority).toBe('medium');
  });

});

describe('PUT /api/services/:id', () => {

  test('updates an existing service', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ name: 'Updated Seating', duration: 20 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Seating');
  });

  test('returns 404 for non-existent service', async () => {
    const res = await request(app)
      .put('/api/services/9999')
      .send({ name: 'Ghost Service' });
    expect(res.statusCode).toBe(404);
  });

  test('returns 400 when updated name is empty', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ name: '   ' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when updated duration is invalid', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ duration: -10 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when updated priority is invalid', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .send({ priority: 'critical' });
    expect(res.statusCode).toBe(400);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 5: QUEUE — JOIN
══════════════════════════════════════════════════════════ */
describe('POST /api/queue/join', () => {

  test('joins a queue successfully', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Alice Wong' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.position).toBe(1);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.estimatedWaitMinutes).toBeGreaterThan(0);
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ guestName: 'Alice Wong' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when guestName is missing', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when guestName is too short', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'A' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/2 and 50/i);
  });

  test('returns 400 when guestName is too long', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'A'.repeat(51) });
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when service does not exist', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 9999, guestName: 'Alice Wong' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('position increments correctly for multiple guests', async () => {
    const first = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Bob Smith' });
    const second = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Carol Jones' });
    expect(second.body.position).toBeGreaterThan(first.body.position);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 6: QUEUE — LEAVE
══════════════════════════════════════════════════════════ */
describe('POST /api/queue/leave', () => {

  test('removes a guest from the queue by ticket', async () => {
    // Join first to get a ticket
    const join = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Dave Lee' });
    const ticket = join.body.ticket;

    const res = await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 2, ticket });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Dave Lee/);
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app)
      .post('/api/queue/leave')
      .send({ ticket: 'T-1' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when ticket is missing', async () => {
    const res = await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 1 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 for a non-existent ticket', async () => {
    const res = await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 1, ticket: 'T-FAKE' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('returns 404 for a non-existent service', async () => {
    const res = await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 9999, ticket: 'T-1' });
    expect(res.statusCode).toBe(404);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 7: QUEUE — SERVE NEXT
══════════════════════════════════════════════════════════ */
describe('POST /api/queue/serve', () => {

  test('serves the next guest in the queue', async () => {
    // Ensure there is someone in queue 1
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Eve Nguyen' });

    const res = await request(app)
      .post('/api/queue/serve')
      .send({ serviceId: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.servedGuest).toBeDefined();
    expect(res.body.remainingInQueue).toBeGreaterThanOrEqual(0);
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app)
      .post('/api/queue/serve')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when queue is empty', async () => {
    // Use service 2 and drain it
    const queue = await request(app).get('/api/queue/2');
    for (let i = 0; i < queue.body.count; i++) {
      await request(app).post('/api/queue/serve').send({ serviceId: 2 });
    }
    const res = await request(app)
      .post('/api/queue/serve')
      .send({ serviceId: 2 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 8: GET QUEUE (Admin view)
══════════════════════════════════════════════════════════ */
describe('GET /api/queue/:serviceId', () => {

  test('returns the current queue for a valid service', async () => {
    const res = await request(app).get('/api/queue/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeDefined();
  });

  test('includes position and estimatedWaitMinutes for each entry', async () => {
    // Make sure someone is in the queue
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Frank Osei' });

    const res = await request(app).get('/api/queue/1');
    const first = res.body.data[0];
    expect(first.position).toBe(1);
    expect(first.estimatedWaitMinutes).toBeGreaterThan(0);
  });

  test('returns 404 for a non-existent service', async () => {
    const res = await request(app).get('/api/queue/9999');
    expect(res.statusCode).toBe(404);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 9: NOTIFICATIONS
══════════════════════════════════════════════════════════ */
describe('GET /api/notifications', () => {

  test('returns a notifications array', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('notifications are created when a guest joins', async () => {
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Grace Kim' });
    const res = await request(app).get('/api/notifications');
    const messages = res.body.data.map(n => n.message);
    expect(messages.some(m => m.includes('Grace Kim'))).toBe(true);
  });

  test('notifications are created when a guest is served', async () => {
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Hiro Tanaka' });
    await request(app)
      .post('/api/queue/serve')
      .send({ serviceId: 1 });
    const res = await request(app).get('/api/notifications');
    const messages = res.body.data.map(n => n.message);
    expect(messages.some(m => m.includes('seated') || m.includes('next'))).toBe(true);
  });

  test('notifications are created when a guest leaves', async () => {
    const join = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Iris Patel' });
    await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 2, ticket: join.body.ticket });
    const res = await request(app).get('/api/notifications');
    const messages = res.body.data.map(n => n.message);
    expect(messages.some(m => m.includes('Iris Patel'))).toBe(true);
  });

});

/* ══════════════════════════════════════════════════════════
   SECTION 10: HISTORY
══════════════════════════════════════════════════════════ */
describe('GET /api/history', () => {

  test('returns a history array', async () => {
    const res = await request(app).get('/api/history');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('history records a join action', async () => {
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Jake Müller' });
    const res = await request(app).get('/api/history');
    const actions = res.body.data.map(h => h.action);
    expect(actions).toContain('joined');
  });

  test('history records a served action', async () => {
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Karen Liu' });
    await request(app)
      .post('/api/queue/serve')
      .send({ serviceId: 1 });
    const res = await request(app).get('/api/history');
    const actions = res.body.data.map(h => h.action);
    expect(actions).toContain('served');
  });

  test('history records a left action', async () => {
    const join = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 2, guestName: 'Leo Rossi' });
    await request(app)
      .post('/api/queue/leave')
      .send({ serviceId: 2, ticket: join.body.ticket });
    const res = await request(app).get('/api/history');
    const actions = res.body.data.map(h => h.action);
    expect(actions).toContain('left');
  });

  test('filters history by ticket', async () => {
    const join = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Mia Chen' });
    const ticket = join.body.ticket;
    const res = await request(app).get(`/api/history?ticket=${ticket}`);
    expect(res.body.data.every(h => h.ticket === ticket)).toBe(true);
  });

  test('filters history by guestName', async () => {
    await request(app)
      .post('/api/queue/join')
      .send({ serviceId: 1, guestName: 'Nolan Park' });
    const res = await request(app).get('/api/history?guestName=Nolan');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every(h => h.guestName.includes('Nolan'))).toBe(true);
  });

});
