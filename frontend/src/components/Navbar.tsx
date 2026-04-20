/**
 * Navbar - Top navigation bar with simulation controls
 */
import { User, SimulationStatus } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  simStatus: SimulationStatus;
  onSimStart: () => void;
  onSimStop: () => void;
  wsConnected: boolean;
}

export default function Navbar({ user, onLogout, simStatus, onSimStart, onSimStop, wsConnected }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="url(#nav-grad)" />
          <path d="M14 24L20 30L34 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="nav-grad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#e8730e" />
              <stop offset="1" stopColor="#ff9800" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <h1 className="navbar-title">SAP BTP Fleet Monitor</h1>
          <span className="navbar-subtitle">IoT Dashboard | Dastageer - 23053275</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          {wsConnected ? 'Live' : 'Offline'}
        </div>

        <div className="sim-controls">
          {(user.role === 'Admin' || user.role === 'Operator') && (
            <>
              {simStatus.running ? (
                <button onClick={onSimStop} className="btn-sim btn-sim-stop">
                  Stop Simulation
                </button>
              ) : (
                <button onClick={onSimStart} className="btn-sim btn-sim-start">
                  Start Simulation
                </button>
              )}
              {simStatus.running && (
                <span className="sim-badge">
                  <span className="pulse-dot" />
                  Simulating {simStatus.vehicleCount} vehicles
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <span className="user-name">{user.fullName}</span>
          <span className={`user-role role-${user.role.toLowerCase()}`}>{user.role}</span>
        </div>
        <button onClick={onLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}
