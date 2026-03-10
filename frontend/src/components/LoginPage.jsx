/**
 * LoginPage.jsx  –  Production Login Screen
 * Real email/password form with JWT authentication.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field-group">
            <label>Email Address</label>
            <input
              className="field-input"
              type="email"
              placeholder="yourname@zes.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="field-input"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(x => !x)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="login-footer">
          <span className="live-dot" /> Real-time system · Zeal Education Society · {new Date().getFullYear()}
        </div>

        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
          Default login: admin@zes.edu / Admin@123
        </p>
      </div>
    </div>
  );
}
