/**
 * ZES-DARMS Backend Server
 * Node.js + Express + Socket.IO + SQLite (swap for PostgreSQL in production)
 * 
 * Run:  npm install && node server.js
 * Port: 4000
 */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const Database   = require('better-sqlite3');
const path       = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'zes-darms-secret-change-in-production';
const DB_PATH    = process.env.DB_PATH    || './zes_darms.db';

// ─── App Setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

app.use(cors());
app.use(express.json());

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL,
    institution TEXT,
    department  TEXT,
    mobile      TEXT,
    emp_id      TEXT,
    status      TEXT DEFAULT 'Active',
    force_pwd_change INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    created_by  TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id                TEXT PRIMARY KEY,
    type              TEXT NOT NULL,
    faculty_id        TEXT NOT NULL,
    faculty_name      TEXT NOT NULL,
    institution       TEXT NOT NULL,
    department        TEXT NOT NULL,
    date              TEXT NOT NULL,
    subject           TEXT,
    class             TEXT,
    topic             TEXT,
    students_present  INTEGER,
    total_students    INTEGER,
    learning_outcome  TEXT,
    remarks           TEXT,
    students_contacted INTEGER,
    parents_communicated INTEGER,
    issues_identified TEXT,
    follow_up         TEXT,
    location          TEXT,
    students_involved TEXT,
    action_taken      TEXT,
    student_name      TEXT,
    roll_no           TEXT,
    reason            TEXT,
    parent_contacted  TEXT,
    attendance_summary TEXT,
    student_issues    TEXT,
    academic_progress TEXT,
    special_obs       TEXT,
    status            TEXT DEFAULT 'Pending',
    hod_remark        TEXT,
    principal_remark  TEXT,
    submitted_at      TEXT DEFAULT (datetime('now')),
    updated_at        TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (faculty_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    to_user    TEXT NOT NULL,
    msg        TEXT NOT NULL,
    type       TEXT DEFAULT 'info',
    read       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         TEXT PRIMARY KEY,
    action     TEXT NOT NULL,
    performed_by TEXT,
    target     TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed Admin user ──────────────────────────────────────────────────────────
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@zes.edu');
if (!existing) {
  const hashed = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, institution, department, mobile, emp_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('u1', 'Rajesh Sharma', 'admin@zes.edu', hashed, 'Admin',
         'Zeal College of Engineering & Research, Narhe', 'Administration', '9876543210', 'EMP001');
  console.log('✅ Seeded admin user: admin@zes.edu / Admin@123');
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function uid() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, 'Active');
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, institution: user.institution, department: user.department },
    JWT_SECRET, { expiresIn: '8h' }
  );
  // Audit
  db.prepare('INSERT INTO audit_log (id, action, performed_by) VALUES (?,?,?)').run(uid(), `Login`, user.name);
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Current password incorrect' });
  }
  db.prepare('UPDATE users SET password = ?, force_pwd_change = 0 WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ success: true });
});

// ─── User Routes (Admin only for write) ──────────────────────────────────────
app.get('/api/users', authenticate, (req, res) => {
  let users;
  if (req.user.role === 'Admin') {
    users = db.prepare('SELECT * FROM users').all();
  } else if (req.user.role === 'Director') {
    users = db.prepare('SELECT * FROM users WHERE institution = ?').all(req.user.institution);
  } else {
    users = db.prepare('SELECT * FROM users WHERE department = ? AND institution = ?')
               .all(req.user.department, req.user.institution);
  }
  res.json(users.map(sanitizeUser));
});

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { name, email, role, institution, department, mobile, empId, status } = req.body;
  if (!name || !email || !role) return res.status(400).json({ error: 'Name, email, role required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists' });
  
  const tempPassword = 'Temp@' + Math.floor(Math.random() * 9000 + 1000);
  const id = uid();
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, institution, department, mobile, emp_id, status, force_pwd_change, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, name, email, bcrypt.hashSync(tempPassword, 10), role, institution, department, mobile, empId, status || 'Active', req.user.id);
  
  db.prepare('INSERT INTO audit_log (id, action, performed_by, target) VALUES (?,?,?,?)')
    .run(uid(), `Created user ${name} (${role})`, req.user.name, id);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  
  // Broadcast to all admins via Socket.IO
  io.emit('user:created', sanitizeUser(newUser));
  
  res.status(201).json({ user: sanitizeUser(newUser), tempPassword });
});

app.put('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const { name, role, institution, department, mobile, empId, status } = req.body;
  db.prepare(`
    UPDATE users SET name=?, role=?, institution=?, department=?, mobile=?, emp_id=?, status=?
    WHERE id=?
  `).run(name, role, institution, department, mobile, empId, status, req.params.id);
  
  db.prepare('INSERT INTO audit_log (id, action, performed_by, target) VALUES (?,?,?,?)')
    .run(uid(), `Updated user ${name}`, req.user.name, req.params.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  io.emit('user:updated', sanitizeUser(updated));
  res.json(sanitizeUser(updated));
});

app.put('/api/users/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE users SET status=? WHERE id=?').run(status, req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  db.prepare('INSERT INTO audit_log (id, action, performed_by, target) VALUES (?,?,?,?)')
    .run(uid(), `${status === 'Active' ? 'Activated' : 'Deactivated'} user ${user.name}`, req.user.name, req.params.id);
  io.emit('user:updated', sanitizeUser(user));
  if (status === 'Inactive') io.to(req.params.id).emit('force:logout');
  res.json(sanitizeUser(user));
});

app.post('/api/users/:id/reset-password', authenticate, requireAdmin, (req, res) => {
  const tempPassword = 'Reset@' + Math.floor(Math.random() * 9000 + 1000);
  db.prepare('UPDATE users SET password=?, force_pwd_change=1 WHERE id=?')
    .run(bcrypt.hashSync(tempPassword, 10), req.params.id);
  const user = db.prepare('SELECT name FROM users WHERE id=?').get(req.params.id);
  db.prepare('INSERT INTO audit_log (id, action, performed_by, target) VALUES (?,?,?,?)')
    .run(uid(), `Reset password for ${user.name}`, req.user.name, req.params.id);
  res.json({ tempPassword });
});

// ─── Report Routes ─────────────────────────────────────────────────────────────
app.get('/api/reports', authenticate, (req, res) => {
  const { date, institution, department, type, status } = req.query;
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params = [];

  // Scope by role
  if (req.user.role === 'Faculty') {
    query += ' AND faculty_id = ?'; params.push(req.user.id);
  } else if (req.user.role === 'HoD') {
    query += ' AND department = ? AND institution = ?'; params.push(req.user.department, req.user.institution);
  } else if (req.user.role === 'Principal') {
    query += ' AND institution = ?'; params.push(req.user.institution);
  }
  // Director and Admin see all

  if (date)        { query += ' AND date = ?';        params.push(date); }
  if (institution) { query += ' AND institution = ?'; params.push(institution); }
  if (department)  { query += ' AND department = ?';  params.push(department); }
  if (type)        { query += ' AND type = ?';        params.push(type); }
  if (status)      { query += ' AND status = ?';      params.push(status); }

  query += ' ORDER BY submitted_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/reports', authenticate, (req, res) => {
  const id = uid();
  const r = req.body;
  db.prepare(`
    INSERT INTO reports (id, type, faculty_id, faculty_name, institution, department, date,
      subject, class, topic, students_present, total_students, learning_outcome, remarks,
      students_contacted, parents_communicated, issues_identified, follow_up,
      location, students_involved, action_taken, student_name, roll_no, reason, parent_contacted,
      attendance_summary, student_issues, academic_progress, special_obs, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, r.type, req.user.id, req.user.name, req.user.institution, req.user.department,
    r.date || new Date().toISOString().split('T')[0],
    r.subject, r.class, r.topic, r.studentsPresent, r.totalStudents, r.learningOutcome, r.remarks,
    r.studentsContacted, r.parentsCommunicated, r.issuesIdentified, r.followUp,
    r.location, r.studentsInvolved, r.actionTaken, r.studentName, r.rollNo, r.reason, r.parentContacted,
    r.attendanceSummary, r.studentIssues, r.academicProgress, r.specialObs, 'Pending');

  const newReport = db.prepare('SELECT * FROM reports WHERE id=?').get(id);
  
  // Notify HoDs in that department via socket
  io.emit('report:new', newReport);

  // Create notification for HoD
  const hods = db.prepare('SELECT id FROM users WHERE role=? AND department=? AND institution=?')
                  .all('HoD', req.user.department, req.user.institution);
  hods.forEach(hod => {
    const nid = uid();
    db.prepare('INSERT INTO notifications (id, to_user, msg, type) VALUES (?,?,?,?)')
      .run(nid, hod.id, `${req.user.name} submitted ${r.type} report`, 'info');
    io.to(hod.id).emit('notification:new', { id: nid, to: hod.id, msg: `${req.user.name} submitted ${r.type} report`, type: 'info', ts: Date.now(), read: false });
  });

  db.prepare('INSERT INTO audit_log (id, action, performed_by) VALUES (?,?,?)')
    .run(uid(), `Submitted ${r.type} report`, req.user.name);

  res.status(201).json(newReport);
});

app.put('/api/reports/:id', authenticate, (req, res) => {
  const { status, hodRemark, principalRemark } = req.body;
  const report = db.prepare('SELECT * FROM reports WHERE id=?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Not found' });

  // Permission check
  if (status && req.user.role === 'Faculty') return res.status(403).json({ error: 'Not allowed' });

  db.prepare(`UPDATE reports SET status=?, hod_remark=?, principal_remark=?, updated_at=datetime('now') WHERE id=?`)
    .run(status || report.status, hodRemark ?? report.hod_remark, principalRemark ?? report.principal_remark, req.params.id);

  const updated = db.prepare('SELECT * FROM reports WHERE id=?').get(req.params.id);
  io.emit('report:update', updated);

  // Notify faculty
  const nid = uid();
  const msg = `Your ${report.type} report was ${status || report.status} by ${req.user.name}`;
  db.prepare('INSERT INTO notifications (id, to_user, msg, type) VALUES (?,?,?,?)')
    .run(nid, report.faculty_id, msg, status === 'Approved' ? 'success' : 'warning');
  io.to(report.faculty_id).emit('notification:new', { id: nid, to: report.faculty_id, msg, type: status === 'Approved' ? 'success' : 'warning', ts: Date.now(), read: false });

  db.prepare('INSERT INTO audit_log (id, action, performed_by, target) VALUES (?,?,?,?)')
    .run(uid(), `${status} report: ${report.type}`, req.user.name, req.params.id);

  res.json(updated);
});

// ─── Notifications Routes ──────────────────────────────────────────────────────
app.get('/api/notifications', authenticate, (req, res) => {
  const notifs = db.prepare('SELECT * FROM notifications WHERE to_user=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(notifs);
});

app.put('/api/notifications/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE id=? AND to_user=?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
app.get('/api/audit', authenticate, (req, res) => {
  if (!['Admin', 'Director'].includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
  const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

// ─── Health Score ──────────────────────────────────────────────────────────────
app.get('/api/health', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const institutions = db.prepare('SELECT DISTINCT institution FROM users').all().map(r => r.institution);
  
  const scores = institutions.map(inst => {
    const reports = db.prepare('SELECT * FROM reports WHERE institution=? AND date=?').all(inst, today);
    const total = reports.length || 1;
    const approved = reports.filter(r => r.status === 'Approved').length;
    const avgAtt = reports.reduce((s, r) => s + (r.students_present && r.total_students ? r.students_present / r.total_students : 0.8), 0) / total;
    const score = Math.min(100, Math.max(0, Math.round((approved / total) * 40 + avgAtt * 35 + 25)));
    return { institution: inst, score, date: today };
  });
  res.json(scores);
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  socket.on('auth', (token) => {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      socket.join(user.id);           // Personal room
      socket.join(user.role);         // Role room
      socket.join(user.institution);  // Institution room
      connectedUsers.set(user.id, socket.id);
      io.emit('users:online', Array.from(connectedUsers.keys()));
    } catch {}
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of connectedUsers) {
      if (sid === socket.id) { connectedUsers.delete(uid); break; }
    }
    io.emit('users:online', Array.from(connectedUsers.keys()));
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 ZES-DARMS Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: ${DB_PATH}`);
  console.log(`🔑 Default login: admin@zes.edu / Admin@123\n`);
});

function sanitizeUser(u) {
  const { password, ...safe } = u;
  return safe;
}
