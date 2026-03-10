/**
 * ChangePasswordModal.jsx
 * Shown automatically if user.force_pwd_change === 1
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordModal() {
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 8)                return setError('Password must be at least 8 characters.');
    if (next !== confirm)               return setError('Passwords do not match.');
    if (!/[A-Z]/.test(next))            return setError('Must contain at least one uppercase letter.');
    if (!/[0-9]/.test(next))            return setError('Must contain at least one number.');
    setSaving(true);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>🔐 Change Your Password</h3>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>
          Your administrator has set a temporary password. Please choose a new password to continue.
        </p>
        <form onSubmit={handleSave}>
          <div className="field-group">
            <label>Current (Temporary) Password</label>
            <input className="field-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div className="field-group">
            <label>New Password</label>
            <input className="field-input" type="password" value={next} onChange={e => setNext(e.target.value)} required />
          </div>
          <div className="field-group">
            <label>Confirm New Password</label>
            <input className="field-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={logout}>Logout</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Set Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
