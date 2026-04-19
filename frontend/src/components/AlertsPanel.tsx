/**
 * Alerts Panel — Displays threshold breach alerts
 */
import { Alert } from '../types';
import { api } from '../services/api';

interface AlertsPanelProps {
  alerts: Alert[];
  selectedDeviceId: string | null;
}

export default function AlertsPanel({ alerts, selectedDeviceId }: AlertsPanelProps) {
  const filtered = selectedDeviceId
    ? alerts.filter(a => (a.device_id || a.deviceId) === selectedDeviceId)
    : alerts;

  const displayed = filtered.slice(0, 30);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.alerts.acknowledge(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
  };

  const metricLabels: Record<string, string> = {
    engine_temp: '🌡️ Engine Temp',
    speed: '⚡ Speed',
    fuel_level: '⛽ Fuel Level',
    battery_voltage: '🔋 Battery',
  };

  return (
    <div className="alerts-panel">
      <div className="panel-header">
        <h3>🚨 Active Alerts</h3>
        <span className="panel-count">{filtered.length}</span>
      </div>

      <div className="alerts-list">
        {displayed.length === 0 ? (
          <div className="empty-list">
            <span>✅</span>
            <p>No alerts{selectedDeviceId ? ' for this vehicle' : ''}</p>
          </div>
        ) : (
          displayed.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item severity-${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}
            >
              <div className="alert-severity-bar" />
              <div className="alert-content">
                <div className="alert-top">
                  <span className="alert-metric">{metricLabels[alert.metric] || alert.metric}</span>
                  <span className={`alert-badge badge-${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-bottom">
                  <span className="alert-device">{alert.device_name || alert.vehicle_id}</span>
                  <span className="alert-time">{formatTime(alert.created_at)}</span>
                  {!alert.acknowledged && (
                    <button
                      className="btn-ack"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
