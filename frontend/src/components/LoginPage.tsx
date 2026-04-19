/**
 * Login Page — XSUAA Authentication Simulation
 */
import { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);
    try {
      await onLogin(user, pass);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
              <path d="M14 24L20 30L34 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#e8730e" />
                  <stop offset="1" stopColor="#ff9800" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>SAP BTP Fleet Monitor</h1>
          <p className="login-subtitle">IoT Dashboard — XSUAA Authentication</p>
          <p className="login-credit">Dastageer — 23053275 | OE — SAP_BTP</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login">
          <p className="quick-login-label">Quick Login (Demo)</p>
          <div className="quick-login-buttons">
            <button onClick={() => quickLogin('admin', 'admin123')} className="btn-quick admin">
              <span className="role-icon">👑</span> Admin
            </button>
            <button onClick={() => quickLogin('operator', 'operator123')} className="btn-quick operator">
              <span className="role-icon">📡</span> Operator
            </button>
            <button onClick={() => quickLogin('technician', 'tech123')} className="btn-quick technician">
              <span className="role-icon">🔧</span> Technician
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
