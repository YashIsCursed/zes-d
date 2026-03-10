w/**
 * useRealtime.js  –  Real-time Data Hook
 * Connects to backend Socket.IO, fetches initial data via REST,
 * and keeps local state in sync via live events.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function useRealtime() {
  const { currentUser, socket } = useAuth();

  const [users,         setUsers]         = useState([]);
  const [reports,       setReports]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLog,      setAuditLog]      = useState([]);
  const [liveActivity,  setLiveActivity]  = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [healthScores,  setHealthScores]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [connected,     setConnected]     = useState(false);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    Promise.all([
      api.users.list(),
      api.reports.list(),
      api.notifications.list(),
      api.health.scores(),
    ]).then(([u, r, n, h]) => {
      setUsers(u);
      setReports(r);
      setNotifications(n.map(normalize_notif));
      setHealthScores(h);
      setLoading(false);
    }).catch(err => {
      console.error('Initial data fetch failed:', err);
      setLoading(false);
    });

    if (['Admin', 'Director'].includes(currentUser.role)) {
      api.audit.list().then(setAuditLog).catch(() => {});
    }
  }, [currentUser]);

  // ── Socket.IO listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('report:new', (r) => {
      setReports(prev => [r, ...prev]);
      setLiveActivity(prev => [
        { id: Date.now(), msg: `${r.faculty_name} submitted ${r.type}`, ts: Date.now() },
        ...prev.slice(0, 19),
      ]);
    });

    socket.on('report:update', (r) => {
      setReports(prev => prev.map(x => x.id === r.id ? r : x));
      setLiveActivity(prev => [
        { id: Date.now(), msg: `${r.type} → ${r.status}`, ts: Date.now() },
        ...prev.slice(0, 19),
      ]);
      api.health.scores().then(setHealthScores).catch(() => {});
    });

    socket.on('notification:new', (n) => {
      setNotifications(prev => [normalize_notif(n), ...prev]);
    });

    socket.on('user:created', (u) => {
      setUsers(prev => [...prev, u]);
    });

    socket.on('user:updated', (u) => {
      setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    });

    socket.on('users:online', (ids) => {
      setOnlineUsers(ids);
    });

    socket.on('force:logout', () => {
      window.location.reload();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('report:new');
      socket.off('report:update');
      socket.off('notification:new');
      socket.off('user:created');
      socket.off('user:updated');
      socket.off('users:online');
      socket.off('force:logout');
    };
  }, [socket]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const submitReport = useCallback(async (data) => {
    const r = await api.reports.submit(data);
    setReports(prev => [r, ...prev]);
    return r;
  }, []);

  const updateReport = useCallback(async (id, changes) => {
    const r = await api.reports.update(id, changes);
    setReports(prev => prev.map(x => x.id === id ? r : x));
    setAuditLog(prev => [{ id: Date.now(), action: `Updated report → ${changes.status}`, performed_by: currentUser?.name, created_at: new Date().toISOString() }, ...prev]);
    return r;
  }, [currentUser]);

  const createUser = useCallback(async (data) => {
    const { user, tempPassword } = await api.users.create(data);
    setAuditLog(prev => [{ id: Date.now(), action: `Created user ${user.name}`, performed_by: currentUser?.name, created_at: new Date().toISOString() }, ...prev]);
    return { user, tempPassword };
  }, [currentUser]);

  const updateUser = useCallback(async (id, changes) => {
    const updated = await api.users.update(id, changes);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    return updated;
  }, []);

  const setUserStatus = useCallback(async (id, status) => {
    const updated = await api.users.setStatus(id, status);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    return updated;
  }, []);

  const resetPassword = useCallback(async (id) => {
    return api.users.resetPassword(id);
  }, []);

  const markNotifRead = useCallback(async (id) => {
    await api.notifications.read(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    users, reports, notifications, auditLog, liveActivity,
    onlineUsers, healthScores, loading, connected, unreadCount,
    submitReport, updateReport, createUser, updateUser, setUserStatus,
    resetPassword, markNotifRead,
  };
}

// Normalize snake_case from DB to camelCase for UI compatibility
function normalize_notif(n) {
  return {
    id:   n.id,
    to:   n.to_user || n.to,
    msg:  n.msg,
    type: n.type,
    ts:   n.created_at ? new Date(n.created_at).getTime() : (n.ts || Date.now()),
    read: !!n.read,
  };
}
