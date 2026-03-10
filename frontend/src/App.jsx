import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── Real-Time Event Bus (simulates WebSocket / Socket.IO) ─────────────────
class EventBus {
  constructor() {
    this.listeners = {};
    this.history = [];
  }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => { this.listeners[event] = this.listeners[event].filter(x => x !== cb); };
  }
  emit(event, data) {
    const payload = { event, data, ts: Date.now() };
    this.history.push(payload);
    (this.listeners[event] || []).forEach(cb => setTimeout(() => cb(data), Math.random() * 80 + 20));
    (this.listeners["*"] || []).forEach(cb => setTimeout(() => cb(payload), Math.random() * 80 + 20));
  }
}
const bus = new EventBus();

// ─── Global State ────────────────────────────────────────────────────────────
const INSTITUTIONS = [
  "Zeal College of Engineering & Research, Narhe",
  "Zeal Polytechnic, Narhe",
  "Zeal Institute of Business Administration, Narhe",
  "Zeal Institute of Management & Computer Application, Narhe",
  "Zeal College of Engineering & Research – MBA",
  "Zeal Private ITI, Narhe",
  "Zeal Junior College, Narhe",
  "Dnyanganga English Medium School, Hingane",
  "Silver Crest English Medium School, Hingane",
  "Zeal International School, Sangli",
  "Zeal Institute of Technology, Sangli",
];

const DEPARTMENTS = [
  "Computer Engineering", "Information Technology", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Electronics & Telecommunication",
  "AI & Data Science", "AI & Machine Learning", "Robotics & Automation",
  "MBA", "MCA", "Science", "Commerce", "Science & Humanities",
];

const ROLES = { ADMIN: "Admin", DIRECTOR: "Director", PRINCIPAL: "Principal", HOD: "HoD", FACULTY: "Faculty" };

// Seed users
const initialUsers = [
  { id: "u1", name: "Rajesh Sharma", email: "admin@zes.edu", role: ROLES.ADMIN, institution: INSTITUTIONS[0], department: "Administration", status: "Active", empId: "EMP001", mobile: "9876543210" },
  { id: "u2", name: "Dr. Priya Mehta", email: "director@zes.edu", role: ROLES.DIRECTOR, institution: INSTITUTIONS[0], department: "Administration", status: "Active", empId: "EMP002", mobile: "9876543211" },
  { id: "u3", name: "Prof. Anil Deshmukh", email: "principal@zes.edu", role: ROLES.PRINCIPAL, institution: INSTITUTIONS[0], department: "Administration", status: "Active", empId: "EMP003", mobile: "9876543212" },
  { id: "u4", name: "Dr. Sunita Patil", email: "hod@zes.edu", role: ROLES.HOD, institution: INSTITUTIONS[0], department: "Computer Engineering", status: "Active", empId: "EMP004", mobile: "9876543213" },
  { id: "u5", name: "Prof. Vikram Joshi", email: "faculty@zes.edu", role: ROLES.FACULTY, institution: INSTITUTIONS[0], department: "Computer Engineering", status: "Active", empId: "EMP005", mobile: "9876543214" },
  { id: "u6", name: "Prof. Kavita Rao", email: "faculty2@zes.edu", role: ROLES.FACULTY, institution: INSTITUTIONS[0], department: "Computer Engineering", status: "Active", empId: "EMP006", mobile: "9876543215" },
  { id: "u7", name: "Prof. Nilesh Kulkarni", email: "faculty3@zes.edu", role: ROLES.FACULTY, institution: INSTITUTIONS[1], department: "Mechanical Engineering", status: "Active", empId: "EMP007", mobile: "9876543216" },
  { id: "u8", name: "Dr. Meena Iyer", email: "hod2@zes.edu", role: ROLES.HOD, institution: INSTITUTIONS[1], department: "Mechanical Engineering", status: "Active", empId: "EMP008", mobile: "9876543217" },
];

// Seed reports
const today = new Date().toISOString().split("T")[0];
const initialReports = [
  { id: "r1", type: "Daily Academic Activity", faculty: "u5", facultyName: "Prof. Vikram Joshi", institution: INSTITUTIONS[0], department: "Computer Engineering", date: today, subject: "Data Structures", class: "SE-B", topic: "Binary Trees & Traversals", studentsPresent: 42, totalStudents: 48, learningOutcome: "Students able to implement tree traversal algorithms", remarks: "Good engagement", status: "Pending", hodRemark: "", principalRemark: "", submittedAt: Date.now() - 3600000 },
  { id: "r2", type: "Daily Academic Activity", faculty: "u6", facultyName: "Prof. Kavita Rao", institution: INSTITUTIONS[0], department: "Computer Engineering", date: today, subject: "Database Management", class: "TE-A", topic: "Normalization 3NF", studentsPresent: 38, totalStudents: 45, learningOutcome: "Understanding of normalization forms", remarks: "", status: "Approved", hodRemark: "Well conducted", principalRemark: "", submittedAt: Date.now() - 7200000 },
  { id: "r3", type: "GFM Activity", faculty: "u5", facultyName: "Prof. Vikram Joshi", institution: INSTITUTIONS[0], department: "Computer Engineering", date: today, studentsContacted: 5, parentsCommunicated: 4, issuesIdentified: "Irregular attendance – 2 students", followUp: "Called parents, will monitor next week", status: "Pending", hodRemark: "", submittedAt: Date.now() - 1800000 },
  { id: "r4", type: "Discipline Coordinator", faculty: "u6", facultyName: "Prof. Kavita Rao", institution: INSTITUTIONS[0], department: "Computer Engineering", date: today, issuesIdentified: "Mobile phone usage during lecture", location: "Lab 3", studentsInvolved: "Roll No. 15, 22", actionTaken: "Warning issued", status: "Approved", hodRemark: "Action noted", submittedAt: Date.now() - 5400000 },
  { id: "r5", type: "Daily Academic Activity", faculty: "u7", facultyName: "Prof. Nilesh Kulkarni", institution: INSTITUTIONS[1], department: "Mechanical Engineering", date: today, subject: "Thermodynamics", class: "FE-C", topic: "Laws of Thermodynamics", studentsPresent: 30, totalStudents: 35, learningOutcome: "Understanding of first and second law", remarks: "Some students need extra sessions", status: "Pending", hodRemark: "", principalRemark: "", submittedAt: Date.now() - 900000 },
];

// Seed notifications
const initialNotifications = [
  { id: "n1", to: "u4", msg: "Prof. Vikram Joshi submitted Daily Academic Activity Report", type: "info", ts: Date.now() - 3600000, read: false },
  { id: "n2", to: "u5", msg: "Your report for Data Structures is pending HoD review", type: "warning", ts: Date.now() - 1800000, read: false },
  { id: "n3", to: "u2", msg: "Institute health score updated: 78 (Good)", type: "success", ts: Date.now() - 900000, read: false },
  { id: "n4", to: "u3", msg: "2 faculty reports pending your review", type: "warning", ts: Date.now() - 600000, read: false },
];

// ─── Compute Health Score ────────────────────────────────────────────────────
function computeHealthScore(reports, institutionFilter = null) {
  const filtered = institutionFilter ? reports.filter(r => r.institution === institutionFilter) : reports;
  if (filtered.length === 0) return 72;
  const total = filtered.length;
  const approved = filtered.filter(r => r.status === "Approved").length;
  const pending = filtered.filter(r => r.status === "Pending").length;
  const avgAttendance = filtered.reduce((sum, r) => {
    if (r.studentsPresent && r.totalStudents) return sum + (r.studentsPresent / r.totalStudents);
    return sum + 0.8;
  }, 0) / total;
  const score = Math.round((approved / total) * 40 + avgAttendance * 35 + (1 - pending / total) * 25);
  return Math.min(100, Math.max(0, score + 45));
}

function getHealthLabel(score) {
  if (score >= 90) return { label: "Excellent", color: "#00c896" };
  if (score >= 75) return { label: "Good", color: "#3b82f6" };
  if (score >= 60) return { label: "Needs Improvement", color: "#f59e0b" };
  return { label: "Critical", color: "#ef4444" };
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(initialUsers);
  const [reports, setReports] = useState(initialReports);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(["u2", "u4", "u5"]);
  const [liveActivity, setLiveActivity] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [connected, setConnected] = useState(true);
  const [page, setPage] = useState("login");

  // Real-time simulation: random faculty submit reports
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      if (Math.random() < 0.3) {
        const randomFaculty = users.filter(u => u.role === ROLES.FACULTY);
        const f = randomFaculty[Math.floor(Math.random() * randomFaculty.length)];
        const subjects = ["Operating Systems", "Computer Networks", "Machine Learning", "Web Technologies", "Cloud Computing"];
        const newReport = {
          id: "r" + Date.now(),
          type: "Daily Academic Activity",
          faculty: f.id,
          facultyName: f.name,
          institution: f.institution,
          department: f.department,
          date: today,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          class: ["SE-A", "TE-B", "BE-C", "FE-A"][Math.floor(Math.random() * 4)],
          topic: "Lecture " + Math.floor(Math.random() * 20 + 1),
          studentsPresent: Math.floor(Math.random() * 10 + 35),
          totalStudents: 48,
          learningOutcome: "Covered core concepts",
          remarks: "",
          status: "Pending",
          hodRemark: "",
          principalRemark: "",
          submittedAt: Date.now(),
        };
        bus.emit("report:new", newReport);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [currentUser, users]);

  // Listen to bus events
  useEffect(() => {
    const unsubs = [
      bus.on("report:new", (r) => {
        setReports(prev => [r, ...prev]);
        setLiveActivity(prev => [{ id: Date.now(), msg: `${r.facultyName} submitted ${r.type}`, ts: Date.now() }, ...prev.slice(0, 19)]);
        if (currentUser?.role === ROLES.HOD && r.department === currentUser.department) {
          setNotifications(prev => [{ id: "n" + Date.now(), to: currentUser.id, msg: `${r.facultyName} submitted ${r.type} report`, type: "info", ts: Date.now(), read: false }, ...prev]);
        }
      }),
      bus.on("report:update", (r) => {
        setReports(prev => prev.map(x => x.id === r.id ? r : x));
        setLiveActivity(prev => [{ id: Date.now(), msg: `Report ${r.type} status → ${r.status}`, ts: Date.now() }, ...prev.slice(0, 19)]);
      }),
      bus.on("user:created", (u) => {
        setUsers(prev => [...prev, u]);
        setAuditLog(prev => [{ id: Date.now(), action: `Created user ${u.name} (${u.role})`, by: currentUser?.name, ts: Date.now() }, ...prev]);
      }),
      bus.on("user:updated", (u) => {
        setUsers(prev => prev.map(x => x.id === u.id ? u : x));
        setAuditLog(prev => [{ id: Date.now(), action: `Updated user ${u.name}`, by: currentUser?.name, ts: Date.now() }, ...prev]);
      }),
      bus.on("notification:new", (n) => {
        setNotifications(prev => [n, ...prev]);
      }),
      bus.on("user:online", (uid) => {
        setOnlineUsers(prev => prev.includes(uid) ? prev : [...prev, uid]);
      }),
      bus.on("user:offline", (uid) => {
        setOnlineUsers(prev => prev.filter(x => x !== uid));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [currentUser]);

  const login = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    setCurrentUser(user);
    setPage("dashboard");
    bus.emit("user:online", userId);
    setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
  }, [users]);

  const logout = useCallback(() => {
    if (currentUser) bus.emit("user:offline", currentUser.id);
    setCurrentUser(null);
    setPage("login");
  }, [currentUser]);

  const submitReport = useCallback((report) => {
    const r = { ...report, id: "r" + Date.now(), submittedAt: Date.now(), status: "Pending" };
    bus.emit("report:new", r);
    setAuditLog(prev => [{ id: Date.now(), action: `Submitted ${r.type} report`, by: currentUser?.name, ts: Date.now() }, ...prev]);
  }, [currentUser]);

  const updateReport = useCallback((reportId, changes) => {
    setReports(prev => {
      const updated = prev.map(r => r.id === reportId ? { ...r, ...changes } : r);
      const r = updated.find(r => r.id === reportId);
      bus.emit("report:update", r);
      setAuditLog(prev2 => [{ id: Date.now(), action: `Updated report: ${r.type} → ${changes.status || "edited"}`, by: currentUser?.name, ts: Date.now() }, ...prev2]);
      return updated;
    });
  }, [currentUser]);

  const markNotifRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const createUser = useCallback((userData) => {
    const u = { ...userData, id: "u" + Date.now(), status: "Active" };
    bus.emit("user:created", u);
    bus.emit("notification:new", { id: "n" + Date.now(), to: currentUser?.id, msg: `User ${u.name} created successfully`, type: "success", ts: Date.now(), read: false });
  }, [currentUser]);

  const updateUser = useCallback((userId, changes) => {
    const updated = users.find(u => u.id === userId);
    if (updated) bus.emit("user:updated", { ...updated, ...changes });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...changes } : u));
  }, [users]);

  const myNotifs = notifications.filter(n => n.to === currentUser?.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  const ctx = {
    users, reports, notifications: myNotifs, allNotifications: notifications,
    currentUser, onlineUsers, liveActivity, auditLog, connected,
    login, logout, submitReport, updateReport, markNotifRead, createUser, updateUser,
    unreadCount, setPage, page,
    healthScore: computeHealthScore(reports, currentUser?.institution),
    allHealthScores: INSTITUTIONS.map(inst => ({
      inst, score: computeHealthScore(reports, inst),
      ...getHealthLabel(computeHealthScore(reports, inst))
    })),
    getHealthLabel,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0" }}>
        <style>{globalStyles}</style>
        {page === "login" && <LoginPage />}
        {page === "dashboard" && <MainLayout />}
      </div>
    </AppCtx.Provider>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useApp();
  const demoUsers = [
    { id: "u1", label: "System Admin", sub: "Full system access", icon: "⚙️", color: "#a78bfa" },
    { id: "u2", label: "Director", sub: "All institutions overview", icon: "🏛️", color: "#60a5fa" },
    { id: "u3", label: "Principal", sub: "Institution oversight", icon: "👔", color: "#34d399" },
    { id: "u4", label: "Head of Dept.", sub: "Department monitoring", icon: "🎓", color: "#f59e0b" },
    { id: "u5", label: "Faculty", sub: "Daily reporting", icon: "📚", color: "#fb7185" },
    { id: "u6", label: "Faculty 2", sub: "Daily reporting", icon: "📚", color: "#fb7185" },
  ];
  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-box">
        <div className="login-logo">
          <span className="logo-badge">ZES</span>
          <div>
            <div className="logo-title">DARMS</div>
            <div className="logo-sub">Daily Academic Reporting & Monitoring System</div>
          </div>
        </div>
        <div className="login-divider" />
        <p className="login-hint">Select a role to experience the system:</p>
        <div className="login-roles">
          {demoUsers.map(u => (
            <button key={u.id} className="role-btn" onClick={() => login(u.id)} style={{ "--accent": u.color }}>
              <span className="role-icon">{u.icon}</span>
              <div>
                <div className="role-name">{u.label}</div>
                <div className="role-sub">{u.sub}</div>
              </div>
              <span className="role-arrow">→</span>
            </button>
          ))}
        </div>
        <div className="login-footer">
          <span className="live-dot" /> Real-time system active · {new Date().toLocaleDateString("en-IN")}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function MainLayout() {
  const { currentUser, page, setPage, unreadCount, logout, onlineUsers, connected, liveActivity } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

  const navItems = getNavItems(currentUser?.role);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <span className="logo-badge sm">ZES</span>
          {sidebarOpen && <span className="sidebar-title">DARMS</span>}
        </div>
        <div className="sidebar-user">
          <div className="avatar">{currentUser?.name[0]}</div>
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">{currentUser?.name}</div>
              <div className="user-role">{currentUser?.role}</div>
            </div>
          )}
          <span className={`status-dot ${connected ? "online" : "offline"}`} title={connected ? "Connected" : "Offline"} />
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {item.id === "notifications" && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="online-count">
              <span className="live-dot" /> {onlineUsers.length} online
            </div>
          )}
          <button className="nav-item logout" onClick={logout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(x => !x)}>☰</button>
          <div className="topbar-title">{navItems.find(n => n.id === page)?.label || "Dashboard"}</div>
          <div className="topbar-right">
            <div className="live-feed-mini">
              {liveActivity[0] && <span className="feed-item"><span className="live-dot" /> {liveActivity[0].msg}</span>}
            </div>
            <button className="notif-btn" onClick={() => setShowNotifs(x => !x)}>
              🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            <div className="topbar-date">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</div>
          </div>
        </header>
        {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        <div className="page-content">
          <PageRouter />
        </div>
      </main>
    </div>
  );
}

function getNavItems(role) {
  const common = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "audit", label: "Activity Log", icon: "📋" },
  ];
  if (role === ROLES.ADMIN) return [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "reports_all", label: "All Reports", icon: "📊" },
    { id: "health", label: "Health Monitor", icon: "💓" },
    ...common.slice(1),
  ];
  if (role === ROLES.DIRECTOR) return [
    { id: "dashboard", label: "Director Dashboard", icon: "⊞" },
    { id: "health", label: "Health Monitor", icon: "💓" },
    { id: "reports_all", label: "All Reports", icon: "📊" },
    ...common.slice(1),
  ];
  if (role === ROLES.PRINCIPAL) return [
    { id: "dashboard", label: "Principal Dashboard", icon: "⊞" },
    { id: "reports_all", label: "Faculty Reports", icon: "📊" },
    { id: "health", label: "Health Monitor", icon: "💓" },
    ...common.slice(1),
  ];
  if (role === ROLES.HOD) return [
    { id: "dashboard", label: "HoD Dashboard", icon: "⊞" },
    { id: "verify", label: "Verify Reports", icon: "✅" },
    { id: "health", label: "Dept. Health", icon: "💓" },
    ...common.slice(1),
  ];
  return [
    { id: "dashboard", label: "My Dashboard", icon: "⊞" },
    { id: "submit", label: "Submit Report", icon: "✍️" },
    { id: "my_reports", label: "My Reports", icon: "📄" },
    ...common.slice(1),
  ];
}

function PageRouter() {
  const { page, currentUser } = useApp();
  if (page === "dashboard") {
    if (currentUser?.role === ROLES.ADMIN) return <AdminDashboard />;
    if (currentUser?.role === ROLES.DIRECTOR) return <DirectorDashboard />;
    if (currentUser?.role === ROLES.PRINCIPAL) return <PrincipalDashboard />;
    if (currentUser?.role === ROLES.HOD) return <HoDDashboard />;
    return <FacultyDashboard />;
  }
  if (page === "users") return <UserManagement />;
  if (page === "reports_all") return <AllReports />;
  if (page === "verify") return <VerifyReports />;
  if (page === "submit") return <SubmitReport />;
  if (page === "my_reports") return <MyReports />;
  if (page === "health") return <HealthMonitor />;
  if (page === "notifications") return <NotificationsPage />;
  if (page === "audit") return <AuditPage />;
  return <div>Page not found</div>;
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ onClose }) {
  const { notifications, markNotifRead } = useApp();
  return (
    <div className="notif-panel">
      <div className="notif-header">
        <span>Notifications</span>
        <button onClick={onClose}>✕</button>
      </div>
      {notifications.length === 0 && <div className="notif-empty">No notifications</div>}
      {notifications.slice(0, 10).map(n => (
        <div key={n.id} className={`notif-item ${n.type} ${n.read ? "read" : ""}`} onClick={() => markNotifRead(n.id)}>
          <div className="notif-msg">{n.msg}</div>
          <div className="notif-time">{formatTime(n.ts)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboards ───────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { users, reports, onlineUsers, allHealthScores, liveActivity, auditLog } = useApp();
  const activeUsers = users.filter(u => u.status === "Active").length;
  const todayReports = reports.filter(r => r.date === today).length;
  const pendingReports = reports.filter(r => r.status === "Pending").length;
  const avgHealth = Math.round(allHealthScores.reduce((s, x) => s + x.score, 0) / allHealthScores.length);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Users" value={users.length} sub={`${onlineUsers.length} online now`} color="#a78bfa" />
        <StatCard icon="📊" label="Today's Reports" value={todayReports} sub={`${pendingReports} pending`} color="#60a5fa" />
        <StatCard icon="💓" label="Avg Health Score" value={`${avgHealth}%`} sub={getHealthLabel(avgHealth).label} color="#34d399" />
        <StatCard icon="🏛️" label="Institutions" value={INSTITUTIONS.length} sub="Active institutions" color="#f59e0b" />
      </div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">Institute Health Scores <span className="live-tag">LIVE</span></div>
          <div className="health-list">
            {allHealthScores.slice(0, 6).map(h => (
              <div key={h.inst} className="health-row">
                <span className="health-inst">{h.inst.split(",")[0].substring(0, 28)}…</span>
                <div className="health-bar-wrap">
                  <div className="health-bar" style={{ width: h.score + "%", background: h.color }} />
                </div>
                <span className="health-score" style={{ color: h.color }}>{h.score}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Live Activity Feed <span className="live-tag">LIVE</span></div>
          <div className="feed-list">
            {liveActivity.length === 0 && <div className="empty-state">Waiting for activity…</div>}
            {liveActivity.slice(0, 8).map(a => (
              <div key={a.id} className="feed-row">
                <span className="live-dot sm" />
                <span className="feed-msg">{a.msg}</span>
                <span className="feed-time">{formatTime(a.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">User Breakdown by Role</div>
          {Object.values(ROLES).map(role => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} className="role-bar-row">
                <span className="role-bar-label">{role}</span>
                <div className="health-bar-wrap"><div className="health-bar" style={{ width: (count / users.length * 100) + "%", background: "#6366f1" }} /></div>
                <span className="health-score">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title">Recent Audit Log</div>
          {auditLog.length === 0 && <div className="empty-state">No actions yet</div>}
          {auditLog.slice(0, 6).map(a => (
            <div key={a.id} className="audit-row">
              <div className="audit-action">{a.action}</div>
              <div className="audit-meta">by {a.by} · {formatTime(a.ts)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DirectorDashboard() {
  const { reports, allHealthScores, liveActivity, onlineUsers } = useApp();
  const todayReports = reports.filter(r => r.date === today);
  const avgHealth = Math.round(allHealthScores.reduce((s, x) => s + x.score, 0) / allHealthScores.length);
  const criticals = allHealthScores.filter(h => h.score < 60);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="🏛️" label="Institutions" value={INSTITUTIONS.length} sub="Under ZES" color="#60a5fa" />
        <StatCard icon="💓" label="Avg Health" value={`${avgHealth}%`} sub={getHealthLabel(avgHealth).label} color="#34d399" />
        <StatCard icon="📊" label="Today's Reports" value={todayReports.length} sub="Across all institutions" color="#a78bfa" />
        <StatCard icon="⚠️" label="Critical Alerts" value={criticals.length} sub="Institutions below 60" color="#ef4444" />
      </div>
      {criticals.length > 0 && (
        <div className="alert-banner critical">
          ⚠️ {criticals.length} institution(s) in Critical status: {criticals.map(c => c.inst.split(",")[0]).join(", ")}
        </div>
      )}
      <div className="dash-grid-2">
        <div className="card full-list">
          <div className="card-title">All Institution Health Scores <span className="live-tag">LIVE</span></div>
          {allHealthScores.map(h => (
            <div key={h.inst} className="health-row">
              <span className="health-inst">{h.inst.split(",")[0]}</span>
              <div className="health-bar-wrap">
                <div className="health-bar animated" style={{ width: h.score + "%", background: h.color }} />
              </div>
              <span className="health-badge" style={{ background: h.color + "22", color: h.color, border: `1px solid ${h.color}44` }}>{h.label}</span>
              <span className="health-score" style={{ color: h.color }}>{h.score}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Live System Feed <span className="live-tag">LIVE</span></div>
          {liveActivity.slice(0, 10).map(a => (
            <div key={a.id} className="feed-row">
              <span className="live-dot sm" /><span className="feed-msg">{a.msg}</span><span className="feed-time">{formatTime(a.ts)}</span>
            </div>
          ))}
          {liveActivity.length === 0 && <div className="empty-state">Monitoring…</div>}
        </div>
      </div>
    </div>
  );
}

function PrincipalDashboard() {
  const { reports, currentUser, updateReport, liveActivity } = useApp();
  const myReports = reports.filter(r => r.institution === currentUser?.institution);
  const pending = myReports.filter(r => r.status === "Approved" && !r.principalRemark);
  const approved = myReports.filter(r => r.principalRemark).length;
  const totalFaculty = 6;
  const submitted = [...new Set(myReports.map(r => r.faculty))].length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="👩‍🏫" label="Faculty Submitted" value={`${submitted}/${totalFaculty}`} sub="Today's reports" color="#34d399" />
        <StatCard icon="✅" label="Reviewed by Me" value={approved} sub="Principal reviews" color="#60a5fa" />
        <StatCard icon="⏳" label="Pending Review" value={pending.length} sub="Awaiting principal action" color="#f59e0b" />
        <StatCard icon="📊" label="Total Reports" value={myReports.length} sub="This institution today" color="#a78bfa" />
      </div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">Pending Principal Reviews</div>
          {pending.length === 0 && <div className="empty-state">All reviews complete ✓</div>}
          {pending.map(r => (
            <PrincipalReviewCard key={r.id} report={r} onReview={(remarks, status) => updateReport(r.id, { principalRemark: remarks, status })} />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Department Compliance <span className="live-tag">LIVE</span></div>
          {DEPARTMENTS.slice(0, 6).map(dept => {
            const dReports = myReports.filter(r => r.department === dept);
            const rate = dReports.length ? Math.round(dReports.filter(r => r.status === "Approved").length / dReports.length * 100) : 0;
            return (
              <div key={dept} className="health-row">
                <span className="health-inst">{dept}</span>
                <div className="health-bar-wrap"><div className="health-bar" style={{ width: rate + "%", background: rate > 75 ? "#34d399" : rate > 50 ? "#f59e0b" : "#ef4444" }} /></div>
                <span className="health-score">{rate}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrincipalReviewCard({ report, onReview }) {
  const [remark, setRemark] = useState("");
  return (
    <div className="review-card">
      <div className="rc-header">
        <span className="rc-name">{report.facultyName}</span>
        <span className="rc-type">{report.type}</span>
      </div>
      <div className="rc-details">
        {report.subject && <span>{report.subject} · {report.class}</span>}
        <span>HoD: {report.hodRemark || "Approved"}</span>
      </div>
      <div className="rc-input-row">
        <input className="rc-input" placeholder="Principal remarks…" value={remark} onChange={e => setRemark(e.target.value)} />
        <button className="btn-approve sm" onClick={() => onReview(remark || "Reviewed by Principal", "Approved")}>Approve</button>
        <button className="btn-reject sm" onClick={() => onReview(remark || "Returned", "Rejected")}>Return</button>
      </div>
    </div>
  );
}

function HoDDashboard() {
  const { reports, currentUser, updateReport, users } = useApp();
  const myDeptReports = reports.filter(r => r.department === currentUser?.department && r.institution === currentUser?.institution);
  const pending = myDeptReports.filter(r => r.status === "Pending");
  const approved = myDeptReports.filter(r => r.status === "Approved").length;
  const faculty = users.filter(u => u.role === ROLES.FACULTY && u.department === currentUser?.department);
  const submitted = [...new Set(myDeptReports.map(r => r.faculty))];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="👩‍🏫" label="Dept. Faculty" value={faculty.length} sub={`${submitted.length} submitted today`} color="#34d399" />
        <StatCard icon="⏳" label="Pending Verification" value={pending.length} sub="Awaiting HoD review" color="#f59e0b" />
        <StatCard icon="✅" label="Verified" value={approved} sub="Reports approved" color="#60a5fa" />
        <StatCard icon="📋" label="Total Reports" value={myDeptReports.length} sub={currentUser?.department} color="#a78bfa" />
      </div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">Faculty Submission Status</div>
          {faculty.map(f => {
            const fReports = myDeptReports.filter(r => r.faculty === f.id);
            return (
              <div key={f.id} className="faculty-row">
                <div className="fac-avatar">{f.name[0]}</div>
                <div className="fac-info">
                  <div className="fac-name">{f.name}</div>
                  <div className="fac-count">{fReports.length} report(s)</div>
                </div>
                <span className={`status-chip ${fReports.length > 0 ? "submitted" : "pending"}`}>{fReports.length > 0 ? "Submitted" : "Pending"}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title">Reports to Verify <span className="live-tag">LIVE</span></div>
          {pending.length === 0 && <div className="empty-state">All reports verified ✓</div>}
          {pending.slice(0, 5).map(r => (
            <HoDVerifyCard key={r.id} report={r} onVerify={(remark, status) => updateReport(r.id, { hodRemark: remark, status })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HoDVerifyCard({ report, onVerify }) {
  const [remark, setRemark] = useState("");
  return (
    <div className="review-card">
      <div className="rc-header">
        <span className="rc-name">{report.facultyName}</span>
        <span className="rc-type">{report.type}</span>
      </div>
      {report.subject && <div className="rc-details"><span>{report.subject} · {report.class}</span><span>{formatTime(report.submittedAt)}</span></div>}
      <div className="rc-input-row">
        <input className="rc-input" placeholder="HoD remarks…" value={remark} onChange={e => setRemark(e.target.value)} />
        <button className="btn-approve sm" onClick={() => onVerify(remark || "Verified by HoD", "Approved")}>Approve</button>
        <button className="btn-reject sm" onClick={() => onVerify(remark || "Needs correction", "Rejected")}>Reject</button>
      </div>
    </div>
  );
}

function FacultyDashboard() {
  const { reports, currentUser, notifications, setPage } = useApp();
  const myReports = reports.filter(r => r.faculty === currentUser?.id);
  const todayReports = myReports.filter(r => r.date === today);
  const pending = todayReports.filter(r => r.status === "Pending").length;
  const approved = todayReports.filter(r => r.status === "Approved").length;

  const reportTypes = ["Daily Academic Activity", "GFM Activity", "GFM Absent Student", "Discipline Coordinator", "Class Teacher"];
  const submitted = reportTypes.map(t => ({ type: t, done: todayReports.some(r => r.type === t) }));

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="📋" label="Today's Reports" value={todayReports.length} sub="Submitted today" color="#34d399" />
        <StatCard icon="⏳" label="Pending Review" value={pending} sub="Awaiting HoD" color="#f59e0b" />
        <StatCard icon="✅" label="Approved" value={approved} sub="Reports approved" color="#60a5fa" />
        <StatCard icon="🔔" label="Notifications" value={notifications.filter(n => !n.read).length} sub="Unread messages" color="#a78bfa" />
      </div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">Today's Report Checklist</div>
          {submitted.map(s => (
            <div key={s.type} className="checklist-row">
              <span className={`check-icon ${s.done ? "done" : "pending"}`}>{s.done ? "✓" : "○"}</span>
              <span className="check-label">{s.type}</span>
              {!s.done && <button className="btn-small" onClick={() => setPage("submit")}>Submit</button>}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Recent Report Status</div>
          {myReports.length === 0 && <div className="empty-state">No reports yet. Submit your first report.</div>}
          {myReports.slice(0, 5).map(r => (
            <div key={r.id} className="report-row">
              <div className="report-type">{r.type}</div>
              <div className="report-meta">{r.subject || r.issuesIdentified || "-"} · {formatTime(r.submittedAt)}</div>
              <span className={`status-chip ${r.status.toLowerCase()}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Submit Report ────────────────────────────────────────────────────────────
function SubmitReport() {
  const { currentUser, submitReport, setPage } = useApp();
  const [type, setType] = useState("Daily Academic Activity");
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = ["Daily Academic Activity", "GFM Activity", "GFM Absent Student", "Discipline Coordinator", "Class Teacher"];

  const handleSubmit = () => {
    submitReport({
      type,
      faculty: currentUser.id,
      facultyName: currentUser.name,
      institution: currentUser.institution,
      department: currentUser.department,
      date: today,
      ...form,
    });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({}); setPage("my_reports"); }, 1500);
  };

  if (submitted) return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <div className="success-msg">Report Submitted Successfully!</div>
      <div className="success-sub">Broadcasting to HoD dashboard in real time…</div>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <h2>Submit Report</h2>
          <p>{currentUser?.name} · {currentUser?.department} · {today}</p>
        </div>
        <div className="field-group">
          <label>Report Type</label>
          <select className="field-input" value={type} onChange={e => { setType(e.target.value); setForm({}); }}>
            {reportTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {type === "Daily Academic Activity" && <AcademicReportFields form={form} setForm={setForm} />}
        {type === "GFM Activity" && <GFMReportFields form={form} setForm={setForm} />}
        {type === "GFM Absent Student" && <AbsentStudentFields form={form} setForm={setForm} />}
        {type === "Discipline Coordinator" && <DisciplineFields form={form} setForm={setForm} />}
        {type === "Class Teacher" && <ClassTeacherFields form={form} setForm={setForm} />}
        <button className="btn-primary full" onClick={handleSubmit}>Submit Report →</button>
      </div>
    </div>
  );
}

function AcademicReportFields({ form, setForm }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="fields-grid">
        <div className="field-group"><label>Subject</label><input className="field-input" placeholder="e.g. Data Structures" value={form.subject || ""} onChange={e => f("subject", e.target.value)} /></div>
        <div className="field-group"><label>Class</label><input className="field-input" placeholder="e.g. SE-B" value={form.class || ""} onChange={e => f("class", e.target.value)} /></div>
        <div className="field-group"><label>Lecture Topic</label><input className="field-input" placeholder="Topic covered" value={form.topic || ""} onChange={e => f("topic", e.target.value)} /></div>
        <div className="field-group"><label>Students Present</label><input type="number" className="field-input" placeholder="0" value={form.studentsPresent || ""} onChange={e => f("studentsPresent", e.target.value)} /></div>
        <div className="field-group"><label>Total Students</label><input type="number" className="field-input" placeholder="0" value={form.totalStudents || ""} onChange={e => f("totalStudents", e.target.value)} /></div>
        <div className="field-group"><label>Assignment Given?</label><select className="field-input" value={form.assignment || ""} onChange={e => f("assignment", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select></div>
      </div>
      <div className="field-group"><label>Learning Outcome Achieved</label><textarea className="field-input" rows={2} placeholder="Describe outcomes…" value={form.learningOutcome || ""} onChange={e => f("learningOutcome", e.target.value)} /></div>
      <div className="field-group"><label>Remarks</label><textarea className="field-input" rows={2} placeholder="Additional remarks…" value={form.remarks || ""} onChange={e => f("remarks", e.target.value)} /></div>
    </>
  );
}

function GFMReportFields({ form, setForm }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="fields-grid">
        <div className="field-group"><label>Students Contacted</label><input type="number" className="field-input" value={form.studentsContacted || ""} onChange={e => f("studentsContacted", e.target.value)} /></div>
        <div className="field-group"><label>Parents Communicated</label><input type="number" className="field-input" value={form.parentsCommunicated || ""} onChange={e => f("parentsCommunicated", e.target.value)} /></div>
      </div>
      <div className="field-group"><label>Issues Identified</label><textarea className="field-input" rows={2} value={form.issuesIdentified || ""} onChange={e => f("issuesIdentified", e.target.value)} /></div>
      <div className="field-group"><label>Follow-up Actions</label><textarea className="field-input" rows={2} value={form.followUp || ""} onChange={e => f("followUp", e.target.value)} /></div>
    </>
  );
}

function AbsentStudentFields({ form, setForm }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="fields-grid">
        <div className="field-group"><label>Student Name</label><input className="field-input" value={form.studentName || ""} onChange={e => f("studentName", e.target.value)} /></div>
        <div className="field-group"><label>Roll Number</label><input className="field-input" value={form.rollNo || ""} onChange={e => f("rollNo", e.target.value)} /></div>
        <div className="field-group"><label>Class</label><input className="field-input" value={form.class || ""} onChange={e => f("class", e.target.value)} /></div>
        <div className="field-group"><label>Parent Contacted?</label><select className="field-input" value={form.parentContacted || ""} onChange={e => f("parentContacted", e.target.value)}><option>Yes</option><option>No</option></select></div>
      </div>
      <div className="field-group"><label>Reason for Absence</label><textarea className="field-input" rows={2} value={form.reason || ""} onChange={e => f("reason", e.target.value)} /></div>
      <div className="field-group"><label>Action Taken</label><textarea className="field-input" rows={2} value={form.actionTaken || ""} onChange={e => f("actionTaken", e.target.value)} /></div>
    </>
  );
}

function DisciplineFields({ form, setForm }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="fields-grid">
        <div className="field-group"><label>Location</label><input className="field-input" value={form.location || ""} onChange={e => f("location", e.target.value)} /></div>
        <div className="field-group"><label>Students Involved</label><input className="field-input" value={form.studentsInvolved || ""} onChange={e => f("studentsInvolved", e.target.value)} /></div>
      </div>
      <div className="field-group"><label>Issues Identified</label><textarea className="field-input" rows={2} value={form.issuesIdentified || ""} onChange={e => f("issuesIdentified", e.target.value)} /></div>
      <div className="field-group"><label>Action Taken</label><textarea className="field-input" rows={2} value={form.actionTaken || ""} onChange={e => f("actionTaken", e.target.value)} /></div>
    </>
  );
}

function ClassTeacherFields({ form, setForm }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="field-group"><label>Class Attendance Summary</label><textarea className="field-input" rows={2} value={form.attendanceSummary || ""} onChange={e => f("attendanceSummary", e.target.value)} /></div>
      <div className="field-group"><label>Student Issues</label><textarea className="field-input" rows={2} value={form.studentIssues || ""} onChange={e => f("studentIssues", e.target.value)} /></div>
      <div className="field-group"><label>Academic Progress</label><textarea className="field-input" rows={2} value={form.academicProgress || ""} onChange={e => f("academicProgress", e.target.value)} /></div>
      <div className="field-group"><label>Special Observations</label><textarea className="field-input" rows={2} value={form.specialObs || ""} onChange={e => f("specialObs", e.target.value)} /></div>
    </>
  );
}

// ─── My Reports ───────────────────────────────────────────────────────────────
function MyReports() {
  const { reports, currentUser } = useApp();
  const myReports = reports.filter(r => r.faculty === currentUser?.id);
  return (
    <div className="page-section">
      <div className="section-header"><h2>My Reports</h2><span className="live-tag">LIVE</span></div>
      {myReports.length === 0 && <div className="empty-card">No reports submitted yet.</div>}
      <div className="report-table">
        <div className="rt-header">
          <span>Type</span><span>Subject/Detail</span><span>Date</span><span>Status</span><span>HoD Remark</span>
        </div>
        {myReports.map(r => (
          <div key={r.id} className="rt-row">
            <span className="rt-type">{r.type}</span>
            <span>{r.subject || r.issuesIdentified || r.studentName || "-"}</span>
            <span>{r.date}</span>
            <span className={`status-chip ${r.status.toLowerCase()}`}>{r.status}</span>
            <span className="rt-remark">{r.hodRemark || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Verify Reports (HoD) ─────────────────────────────────────────────────────
function VerifyReports() {
  const { reports, currentUser, updateReport } = useApp();
  const myReports = reports.filter(r => r.department === currentUser?.department);
  const [filter, setFilter] = useState("Pending");
  const filtered = filter === "All" ? myReports : myReports.filter(r => r.status === filter);

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>Department Reports</h2>
        <div className="filter-tabs">
          {["All", "Pending", "Approved", "Rejected"].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f} {f !== "All" && `(${myReports.filter(r => r.status === f).length})`}</button>
          ))}
        </div>
      </div>
      <div className="report-cards">
        {filtered.length === 0 && <div className="empty-card">No reports in this category.</div>}
        {filtered.map(r => <ReportCard key={r.id} report={r} showVerify={r.status === "Pending"} onVerify={(remark, status) => updateReport(r.id, { hodRemark: remark, status })} />)}
      </div>
    </div>
  );
}

function ReportCard({ report: r, showVerify, onVerify }) {
  const [remark, setRemark] = useState("");
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rcard ${expanded ? "expanded" : ""}`}>
      <div className="rcard-top" onClick={() => setExpanded(x => !x)}>
        <div className="rcard-left">
          <div className="rcard-avatar">{r.facultyName[0]}</div>
          <div>
            <div className="rcard-name">{r.facultyName}</div>
            <div className="rcard-type">{r.type}</div>
          </div>
        </div>
        <div className="rcard-right">
          <span className={`status-chip ${r.status.toLowerCase()}`}>{r.status}</span>
          <span className="rcard-time">{formatTime(r.submittedAt)}</span>
          <span className="expand-icon">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div className="rcard-body">
          {r.subject && <div className="rcard-field"><b>Subject:</b> {r.subject} | <b>Class:</b> {r.class} | <b>Topic:</b> {r.topic}</div>}
          {r.studentsPresent && <div className="rcard-field"><b>Attendance:</b> {r.studentsPresent}/{r.totalStudents} ({Math.round(r.studentsPresent / r.totalStudents * 100)}%)</div>}
          {r.learningOutcome && <div className="rcard-field"><b>Learning Outcome:</b> {r.learningOutcome}</div>}
          {r.issuesIdentified && <div className="rcard-field"><b>Issues:</b> {r.issuesIdentified}</div>}
          {r.actionTaken && <div className="rcard-field"><b>Action:</b> {r.actionTaken}</div>}
          {r.studentsContacted && <div className="rcard-field"><b>Students Contacted:</b> {r.studentsContacted} | <b>Parents:</b> {r.parentsCommunicated}</div>}
          {r.remarks && <div className="rcard-field"><b>Remarks:</b> {r.remarks}</div>}
          {r.hodRemark && <div className="rcard-field hod"><b>HoD Remark:</b> {r.hodRemark}</div>}
          {r.principalRemark && <div className="rcard-field principal"><b>Principal Remark:</b> {r.principalRemark}</div>}
          {showVerify && (
            <div className="rcard-verify">
              <input className="rc-input" placeholder="Add remark…" value={remark} onChange={e => setRemark(e.target.value)} />
              <button className="btn-approve sm" onClick={() => onVerify(remark || "Verified", "Approved")}>✓ Approve</button>
              <button className="btn-reject sm" onClick={() => onVerify(remark || "Rejected", "Rejected")}>✗ Reject</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── All Reports ──────────────────────────────────────────────────────────────
function AllReports() {
  const { reports, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const visible = currentUser?.role === ROLES.FACULTY ? reports.filter(r => r.faculty === currentUser.id) :
    currentUser?.role === ROLES.HOD ? reports.filter(r => r.department === currentUser.department) :
    currentUser?.role === ROLES.PRINCIPAL ? reports.filter(r => r.institution === currentUser.institution) : reports;
  const filtered = visible.filter(r =>
    (typeFilter === "All" || r.type === typeFilter) &&
    (statusFilter === "All" || r.status === statusFilter) &&
    (r.facultyName?.toLowerCase().includes(search.toLowerCase()) || r.type?.toLowerCase().includes(search.toLowerCase()) || r.subject?.toLowerCase().includes(search.toLowerCase()))
  );
  const types = ["All", ...new Set(reports.map(r => r.type))];

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>Reports <span className="live-tag">LIVE</span></h2>
        <div className="search-bar"><input className="search-input" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="filter-row">
        <div className="filter-tabs">
          {["All","Pending","Approved","Rejected"].map(f => <button key={f} className={`filter-tab ${statusFilter === f ? "active" : ""}`} onClick={() => setStatusFilter(f)}>{f}</button>)}
        </div>
        <select className="field-input sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="report-table">
        <div className="rt-header"><span>Faculty</span><span>Type</span><span>Dept.</span><span>Date</span><span>Status</span></div>
        {filtered.length === 0 && <div className="empty-card">No reports found.</div>}
        {filtered.map(r => (
          <div key={r.id} className="rt-row">
            <span><b>{r.facultyName}</b></span>
            <span>{r.type}</span>
            <span>{r.department}</span>
            <span>{r.date}</span>
            <span className={`status-chip ${r.status.toLowerCase()}`}>{r.status}</span>
          </div>
        ))}
      </div>
      <div className="table-footer">{filtered.length} report(s) shown · Auto-updating</div>
    </div>
  );
}

// ─── Health Monitor ───────────────────────────────────────────────────────────
function HealthMonitor() {
  const { allHealthScores, reports } = useApp();
  const weights = [
    { param: "Faculty Report Submission", weight: 20 },
    { param: "Lecture Conducted", weight: 20 },
    { param: "Student Attendance", weight: 15 },
    { param: "GFM Activity", weight: 15 },
    { param: "HoD Verification", weight: 15 },
    { param: "Principal Review", weight: 15 },
  ];

  return (
    <div className="page-section">
      <div className="section-header"><h2>Institute Health Monitor <span className="live-tag">LIVE</span></h2></div>
      <div className="health-grid">
        {allHealthScores.map(h => (
          <div key={h.inst} className="health-card" style={{ "--hc": h.color }}>
            <div className="hc-score" style={{ color: h.color }}>{h.score}</div>
            <div className="hc-label" style={{ color: h.color }}>{h.label}</div>
            <div className="hc-name">{h.inst.split(",")[0]}</div>
            <div className="hc-bar"><div className="hc-fill" style={{ width: h.score + "%", background: h.color }} /></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Evaluation Weights (ZES Compliance Model)</div>
        {weights.map(w => (
          <div key={w.param} className="weight-row">
            <span className="weight-param">{w.param}</span>
            <div className="health-bar-wrap"><div className="health-bar" style={{ width: w.weight * 5 + "%", background: "#6366f1" }} /></div>
            <span className="weight-val">{w.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement() {
  const { users, createUser, updateUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editUser, setEditUser] = useState(null);

  const filtered = users.filter(u =>
    (roleFilter === "All" || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>User Management <span className="admin-badge">Admin Only</span></h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create User</button>
      </div>
      <div className="filter-row">
        <input className="search-input" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-tabs">
          {["All", ...Object.values(ROLES)].map(r => <button key={r} className={`filter-tab ${roleFilter === r ? "active" : ""}`} onClick={() => setRoleFilter(r)}>{r}</button>)}
        </div>
      </div>
      <div className="report-table">
        <div className="rt-header"><span>Name</span><span>Email</span><span>Role</span><span>Institution</span><span>Status</span><span>Actions</span></div>
        {filtered.map(u => (
          <div key={u.id} className="rt-row">
            <span><div className="inline-avatar">{u.name[0]}</div> <b>{u.name}</b></span>
            <span className="email-cell">{u.email}</span>
            <span><span className={`role-tag ${u.role.toLowerCase()}`}>{u.role}</span></span>
            <span>{u.institution?.split(",")[0] || "-"}</span>
            <span><span className={`status-chip ${u.status.toLowerCase()}`}>{u.status}</span></span>
            <span>
              <button className="btn-small" onClick={() => setEditUser(u)}>Edit</button>
              <button className="btn-small danger" onClick={() => updateUser(u.id, { status: u.status === "Active" ? "Inactive" : "Active" })}>{u.status === "Active" ? "Deactivate" : "Activate"}</button>
            </span>
          </div>
        ))}
      </div>
      {(showForm || editUser) && <UserFormModal user={editUser} onClose={() => { setShowForm(false); setEditUser(null); }} onCreate={createUser} onUpdate={updateUser} />}
    </div>
  );
}

function UserFormModal({ user, onClose, onCreate, onUpdate }) {
  const [form, setForm] = useState(user || { name: "", email: "", role: ROLES.FACULTY, institution: INSTITUTIONS[0], department: DEPARTMENTS[0], mobile: "", empId: "", status: "Active" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (user) onUpdate(user.id, form);
    else onCreate(form);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{user ? "Edit User" : "Create New User"}</h3><button onClick={onClose}>✕</button></div>
        <div className="fields-grid">
          <div className="field-group"><label>Full Name *</label><input className="field-input" value={form.name} onChange={e => f("name", e.target.value)} /></div>
          <div className="field-group"><label>Email *</label><input className="field-input" type="email" value={form.email} onChange={e => f("email", e.target.value)} /></div>
          <div className="field-group"><label>Mobile</label><input className="field-input" value={form.mobile} onChange={e => f("mobile", e.target.value)} /></div>
          <div className="field-group"><label>Employee ID</label><input className="field-input" value={form.empId} onChange={e => f("empId", e.target.value)} /></div>
          <div className="field-group"><label>Role *</label><select className="field-input" value={form.role} onChange={e => f("role", e.target.value)}>{Object.values(ROLES).map(r => <option key={r}>{r}</option>)}</select></div>
          <div className="field-group"><label>Status</label><select className="field-input" value={form.status} onChange={e => f("status", e.target.value)}><option>Active</option><option>Inactive</option></select></div>
        </div>
        <div className="field-group"><label>Institution</label><select className="field-input" value={form.institution} onChange={e => f("institution", e.target.value)}>{INSTITUTIONS.map(i => <option key={i}>{i}</option>)}</select></div>
        <div className="field-group"><label>Department</label><select className="field-input" value={form.department} onChange={e => f("department", e.target.value)}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{user ? "Save Changes" : "Create User"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage() {
  const { notifications, markNotifRead } = useApp();
  return (
    <div className="page-section">
      <div className="section-header"><h2>Notifications <span className="live-tag">LIVE</span></h2></div>
      {notifications.length === 0 && <div className="empty-card">No notifications.</div>}
      {notifications.map(n => (
        <div key={n.id} className={`notif-full ${n.type} ${n.read ? "read" : ""}`} onClick={() => markNotifRead(n.id)}>
          <div className="notif-icon">{n.type === "success" ? "✓" : n.type === "warning" ? "⚠" : "ℹ"}</div>
          <div>
            <div className="notif-msg">{n.msg}</div>
            <div className="notif-time">{formatTime(n.ts)}</div>
          </div>
          {!n.read && <span className="unread-dot" />}
        </div>
      ))}
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────────────────
function AuditPage() {
  const { auditLog, liveActivity } = useApp();
  return (
    <div className="page-section">
      <div className="section-header"><h2>Activity & Audit Log <span className="live-tag">LIVE</span></h2></div>
      <div className="dash-grid-2">
        <div className="card">
          <div className="card-title">Audit Trail</div>
          {auditLog.length === 0 && <div className="empty-state">No actions recorded yet.</div>}
          {auditLog.map(a => (
            <div key={a.id} className="audit-row">
              <div className="audit-action">{a.action}</div>
              <div className="audit-meta">by {a.by} · {formatTime(a.ts)}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Live System Events</div>
          {liveActivity.length === 0 && <div className="empty-state">Watching for events…</div>}
          {liveActivity.map(a => (
            <div key={a.id} className="feed-row">
              <span className="live-dot sm" /><span className="feed-msg">{a.msg}</span><span className="feed-time">{formatTime(a.ts)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ "--c": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return d.toLocaleDateString("en-IN");
}

// ─── Global Styles ────────────────────────────────────────────────────────────
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0a0f1e; --bg2: #0f1628; --bg3: #161d35; --bg4: #1e2845;
  --border: #2a3456; --border2: #3a4570;
  --text: #e2e8f0; --text2: #94a3b8; --text3: #64748b;
  --accent: #6366f1; --accent2: #818cf8;
  --green: #10b981; --yellow: #f59e0b; --red: #ef4444; --blue: #3b82f6;
  --radius: 12px; --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
}
html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
input, select, textarea, button { font-family: inherit; }

/* Layout */
.layout { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width .25s; flex-shrink: 0; }
.sidebar.closed { width: 64px; }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.page-content { flex: 1; overflow-y: auto; padding: 24px; }

/* Sidebar */
.sidebar-header { display: flex; align-items: center; gap: 10px; padding: 20px 16px; border-bottom: 1px solid var(--border); }
.sidebar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; color: var(--accent2); letter-spacing: 1px; }
.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.avatar { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 11px; color: var(--text2); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: var(--green); box-shadow: 0 0 6px var(--green); }
.status-dot.offline { background: var(--text3); }
.sidebar-nav { flex: 1; padding: 8px; overflow-y: auto; }
.nav-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); background: none; border: none; color: var(--text2); cursor: pointer; font-size: 14px; transition: all .15s; text-align: left; position: relative; }
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--accent); color: #fff; }
.nav-item.logout { color: var(--red); }
.nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
.nav-label { flex: 1; }
.sidebar-footer { padding: 12px 8px; border-top: 1px solid var(--border); }
.online-count { font-size: 11px; color: var(--text3); padding: 6px 12px; display: flex; align-items: center; gap: 6px; }

/* Topbar */
.topbar { display: flex; align-items: center; gap: 16px; padding: 0 24px; height: 60px; background: var(--bg2); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.toggle-btn { background: none; border: none; color: var(--text2); font-size: 20px; cursor: pointer; }
.topbar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 16px; }
.live-feed-mini { font-size: 12px; color: var(--text3); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notif-btn { background: none; border: none; color: var(--text2); font-size: 18px; cursor: pointer; position: relative; }
.topbar-date { font-size: 12px; color: var(--text3); }
.badge { background: var(--red); color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }

/* Logo */
.logo-badge { background: linear-gradient(135deg, #6366f1, #7c3aed); color: #fff; font-weight: 800; font-size: 14px; padding: 6px 10px; border-radius: 8px; letter-spacing: 1px; }
.logo-badge.sm { font-size: 11px; padding: 4px 7px; }

/* Login */
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); position: relative; overflow: hidden; }
.login-glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
.login-box { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 480px; max-width: 95vw; z-index: 1; }
.login-logo { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
.logo-title { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 28px; color: var(--accent2); letter-spacing: 2px; }
.logo-sub { font-size: 12px; color: var(--text3); }
.login-divider { height: 1px; background: var(--border); margin: 20px 0; }
.login-hint { color: var(--text2); font-size: 13px; margin-bottom: 16px; }
.login-roles { display: flex; flex-direction: column; gap: 8px; }
.role-btn { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; color: var(--text); cursor: pointer; transition: all .15s; text-align: left; }
.role-btn:hover { border-color: var(--accent); background: var(--bg4); transform: translateX(4px); }
.role-icon { font-size: 22px; }
.role-name { font-weight: 600; font-size: 14px; }
.role-sub { font-size: 11px; color: var(--text3); }
.role-arrow { margin-left: auto; color: var(--text3); font-size: 16px; }
.login-footer { margin-top: 24px; font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 6px; }

/* Cards */
.card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 16px; text-transform: uppercase; letter-spacing: .8px; display: flex; align-items: center; gap: 8px; }
.live-tag { background: #10b98122; color: var(--green); border: 1px solid #10b98133; border-radius: 4px; padding: 2px 6px; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }

/* Stat Cards */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; gap: 14px; align-items: flex-start; border-left: 3px solid var(--c, var(--accent)); transition: transform .15s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-icon { font-size: 24px; }
.stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: var(--c, var(--text)); }
.stat-label { font-size: 13px; font-weight: 600; color: var(--text); margin-top: 2px; }
.stat-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

/* Dashboard Grid */
.dashboard { padding: 0; }
.dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

/* Health */
.health-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.health-row:last-child { border-bottom: none; }
.health-inst { font-size: 12px; color: var(--text2); width: 180px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.health-bar-wrap { flex: 1; background: var(--bg4); border-radius: 4px; height: 6px; overflow: hidden; }
.health-bar { height: 100%; border-radius: 4px; transition: width .8s ease; }
.health-bar.animated { animation: growBar .8s ease; }
.health-score { font-size: 12px; font-weight: 700; width: 30px; text-align: right; }
.health-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
@keyframes growBar { from { width: 0 } }

/* Feed */
.feed-list { overflow-y: auto; max-height: 280px; }
.feed-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
.feed-row:last-child { border-bottom: none; }
.feed-msg { flex: 1; color: var(--text2); }
.feed-time { color: var(--text3); font-size: 11px; white-space: nowrap; }
.feed-item { font-size: 12px; color: var(--text3); display: flex; align-items: center; gap: 6px; }

/* Live dot */
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); display: inline-block; animation: pulse 2s infinite; flex-shrink: 0; }
.live-dot.sm { width: 5px; height: 5px; }
@keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.5)} 50%{opacity:.7;box-shadow:0 0 0 4px rgba(16,185,129,0)} }

/* Notifications */
.notif-panel { position: absolute; right: 16px; top: 64px; width: 340px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); z-index: 100; max-height: 480px; overflow-y: auto; box-shadow: var(--shadow); }
.notif-header { display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 14px; }
.notif-header button { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; }
.notif-empty { padding: 20px; text-align: center; color: var(--text3); font-size: 13px; }
.notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .1s; }
.notif-item:hover { background: var(--bg3); }
.notif-item.read { opacity: .5; }
.notif-item.success { border-left: 3px solid var(--green); }
.notif-item.warning { border-left: 3px solid var(--yellow); }
.notif-item.info { border-left: 3px solid var(--blue); }
.notif-msg { font-size: 13px; }
.notif-time { font-size: 11px; color: var(--text3); margin-top: 4px; }
.notif-full { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px; cursor: pointer; transition: all .15s; }
.notif-full:hover { border-color: var(--border2); }
.notif-full.read { opacity: .5; }
.notif-full.success { border-left: 3px solid var(--green); }
.notif-full.warning { border-left: 3px solid var(--yellow); }
.notif-full.info { border-left: 3px solid var(--blue); }
.notif-icon { font-size: 18px; flex-shrink: 0; }
.unread-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; margin-left: auto; margin-top: 4px; }

/* Forms */
.form-page { max-width: 700px; margin: 0 auto; }
.form-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; }
.form-header { margin-bottom: 24px; }
.form-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; }
.form-header p { color: var(--text3); font-size: 13px; margin-top: 4px; }
.field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.field-group label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .5px; }
.field-input { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); padding: 10px 12px; font-size: 14px; transition: border-color .15s; }
.field-input:focus { outline: none; border-color: var(--accent); }
.field-input.sm { padding: 6px 10px; font-size: 13px; }
textarea.field-input { resize: vertical; }
select.field-input { cursor: pointer; }
.fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }

/* Buttons */
.btn-primary { background: var(--accent); color: #fff; border: none; border-radius: var(--radius-sm); padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
.btn-primary:hover { background: var(--accent2); transform: translateY(-1px); }
.btn-primary.full { width: 100%; padding: 14px; font-size: 15px; margin-top: 8px; }
.btn-secondary { background: var(--bg3); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 20px; font-size: 14px; cursor: pointer; }
.btn-approve { background: #10b98122; color: var(--green); border: 1px solid #10b98133; border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-approve:hover { background: #10b98133; }
.btn-approve.sm { padding: 5px 10px; font-size: 12px; }
.btn-reject { background: #ef444422; color: var(--red); border: 1px solid #ef444433; border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-reject:hover { background: #ef444433; }
.btn-reject.sm { padding: 5px 10px; font-size: 12px; }
.btn-small { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; margin-right: 4px; }
.btn-small:hover { border-color: var(--accent); color: var(--text); }
.btn-small.danger:hover { border-color: var(--red); color: var(--red); }

/* Report Cards */
.review-card { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 10px; }
.rc-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.rc-name { font-weight: 600; font-size: 14px; }
.rc-type { font-size: 11px; color: var(--accent2); background: var(--accent)22; padding: 2px 8px; border-radius: 4px; }
.rc-details { font-size: 12px; color: var(--text3); margin-bottom: 10px; display: flex; gap: 12px; }
.rc-input-row { display: flex; gap: 8px; }
.rc-input { flex: 1; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 6px 10px; font-size: 13px; }
.rc-input:focus { outline: none; border-color: var(--accent); }

/* Status Chips */
.status-chip { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; }
.status-chip.pending { background: #f59e0b22; color: var(--yellow); border: 1px solid #f59e0b33; }
.status-chip.approved { background: #10b98122; color: var(--green); border: 1px solid #10b98133; }
.status-chip.rejected { background: #ef444422; color: var(--red); border: 1px solid #ef444433; }
.status-chip.active { background: #10b98122; color: var(--green); border: 1px solid #10b98133; }
.status-chip.inactive { background: #ef444422; color: var(--red); border: 1px solid #ef444433; }

/* Report Table */
.report-table { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.rt-header { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr; gap: 0; padding: 12px 16px; background: var(--bg3); font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; }
.rt-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr; gap: 0; padding: 12px 16px; border-top: 1px solid var(--border); font-size: 13px; align-items: center; transition: background .1s; }
.rt-row:hover { background: var(--bg3); }
.rt-type { font-size: 12px; color: var(--text2); }
.rt-remark { font-size: 12px; color: var(--text3); }
.table-footer { font-size: 11px; color: var(--text3); padding: 8px 16px; background: var(--bg2); border: 1px solid var(--border); border-top: none; border-radius: 0 0 var(--radius) var(--radius); }

/* Faculty Row */
.faculty-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.faculty-row:last-child { border-bottom: none; }
.fac-avatar { width: 32px; height: 32px; background: linear-gradient(135deg,#6366f1,#7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
.fac-info { flex: 1; }
.fac-name { font-size: 13px; font-weight: 500; }
.fac-count { font-size: 11px; color: var(--text3); }
.status-chip.submitted { background: #10b98122; color: var(--green); border: 1px solid #10b98133; }

/* Health Grid */
.health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
.health-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; border-top: 3px solid var(--hc); }
.hc-score { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; }
.hc-label { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.hc-name { font-size: 12px; color: var(--text3); margin-bottom: 12px; }
.hc-bar { height: 4px; background: var(--bg4); border-radius: 4px; overflow: hidden; }
.hc-fill { height: 100%; border-radius: 4px; transition: width .8s; }

/* Weight Row */
.weight-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.weight-row:last-child { border-bottom: none; }
.weight-param { font-size: 13px; width: 220px; flex-shrink: 0; }
.weight-val { font-size: 13px; font-weight: 700; color: var(--accent2); width: 40px; text-align: right; }
.role-bar-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.role-bar-label { font-size: 13px; width: 80px; flex-shrink: 0; color: var(--text2); }

/* Report Cards expanded */
.report-cards { display: flex; flex-direction: column; gap: 8px; }
.rcard { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.rcard-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; transition: background .1s; }
.rcard-top:hover { background: var(--bg3); }
.rcard-left { display: flex; align-items: center; gap: 12px; }
.rcard-avatar { width: 36px; height: 36px; background: linear-gradient(135deg,#6366f1,#7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.rcard-name { font-size: 14px; font-weight: 600; }
.rcard-type { font-size: 12px; color: var(--text3); }
.rcard-right { display: flex; align-items: center; gap: 12px; }
.rcard-time { font-size: 11px; color: var(--text3); }
.expand-icon { font-size: 10px; color: var(--text3); }
.rcard-body { padding: 14px 16px; border-top: 1px solid var(--border); background: var(--bg3); }
.rcard-field { font-size: 13px; color: var(--text2); margin-bottom: 6px; }
.rcard-field.hod { color: var(--blue); }
.rcard-field.principal { color: var(--green); }
.rcard-verify { display: flex; gap: 8px; margin-top: 12px; }

/* User Management */
.admin-badge { background: #a78bfa22; color: #a78bfa; border: 1px solid #a78bfa33; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.role-tag { font-size: 11px; padding: 3px 8px; border-radius: 10px; font-weight: 600; }
.role-tag.admin { background: #a78bfa22; color: #a78bfa; }
.role-tag.director { background: #60a5fa22; color: #60a5fa; }
.role-tag.principal { background: #34d39922; color: #34d399; }
.role-tag.hod { background: #f59e0b22; color: #f59e0b; }
.role-tag.faculty { background: #fb718522; color: #fb7185; }
.email-cell { font-size: 12px; color: var(--text3); }
.inline-avatar { width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { background: var(--bg2); border: 1px solid var(--border2); border-radius: 16px; width: 560px; max-width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: var(--shadow); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h3 { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; }
.modal-header button { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 20px; }

/* Misc */
.page-section { }
.section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.section-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; }
.filter-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 4px; }
.filter-tab { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; color: var(--text2); padding: 6px 14px; font-size: 12px; cursor: pointer; transition: all .15s; }
.filter-tab:hover { border-color: var(--border2); color: var(--text); }
.filter-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.search-bar { margin-left: auto; }
.search-input { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); padding: 8px 14px; font-size: 13px; width: 240px; }
.search-input:focus { outline: none; border-color: var(--accent); }
.empty-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; text-align: center; color: var(--text3); font-size: 14px; }
.empty-state { text-align: center; color: var(--text3); font-size: 13px; padding: 16px; }
.alert-banner { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 13px; font-weight: 600; }
.alert-banner.critical { background: #ef444422; border: 1px solid #ef444433; color: var(--red); }
.audit-row { padding: 8px 0; border-bottom: 1px solid var(--border); }
.audit-row:last-child { border-bottom: none; }
.audit-action { font-size: 13px; }
.audit-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.checklist-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.checklist-row:last-child { border-bottom: none; }
.check-icon { font-size: 16px; width: 20px; flex-shrink: 0; }
.check-icon.done { color: var(--green); }
.check-icon.pending { color: var(--text3); }
.check-label { flex: 1; font-size: 13px; }
.report-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.report-row:last-child { border-bottom: none; }
.report-type { flex: 1; font-size: 13px; font-weight: 500; }
.report-meta { font-size: 11px; color: var(--text3); }
.success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 12px; }
.success-icon { width: 72px; height: 72px; background: #10b98122; border: 2px solid var(--green); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--green); animation: popIn .3s ease; }
.success-msg { font-size: 22px; font-weight: 700; color: var(--green); }
.success-sub { font-size: 14px; color: var(--text3); }
@keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
.full-list { grid-column: 1/-1; }

/* Scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .dash-grid-2 { grid-template-columns: 1fr; }
  .rt-header, .rt-row { grid-template-columns: 2fr 2fr 1fr 1fr; }
  .rt-header span:nth-child(3), .rt-row span:nth-child(3) { display: none; }
  .sidebar { width: 64px; }
  .sidebar .user-info, .sidebar .sidebar-title, .sidebar .nav-label, .sidebar .online-count { display: none; }
}
`;
