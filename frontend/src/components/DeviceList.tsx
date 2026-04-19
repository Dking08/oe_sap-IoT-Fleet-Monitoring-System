/**
 * Device List — Sidebar showing all fleet vehicles
 */
import { Device, TelemetryData } from '../types';

interface DeviceListProps {
  devices: Device[];
  latestTelemetry: Record<string, TelemetryData>;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  onTriggerFault: (id: string) => void;
  userRole: string;
}

const typeIcons: Record<string, string> = {
  Truck: '🚛',
  Van: '🚐',
  Car: '🚗',
};

const statusColors: Record<string, string> = {
  OK: '#66bb6a',
  Warning: '#ffa726',
  Critical: '#ef5350',
  Offline: '#78909c',
};

export default function DeviceList({ devices, latestTelemetry, selectedDeviceId, onSelectDevice, onTriggerFault, userRole }: DeviceListProps) {
  const counts = {
    total: devices.length,
    ok: devices.filter(d => d.status === 'OK').length,
    warning: devices.filter(d => d.status === 'Warning').length,
    critical: devices.filter(d => d.status === 'Critical').length,
    offline: devices.filter(d => d.status === 'Offline').length,
  };

  return (
    <div className="device-list">
      <div className="device-list-header">
        <h2>Fleet Vehicles</h2>
        <div className="fleet-stats">
          <span className="stat" style={{ color: '#66bb6a' }}>{counts.ok} OK</span>
          <span className="stat" style={{ color: '#ffa726' }}>{counts.warning} ⚠</span>
          <span className="stat" style={{ color: '#ef5350' }}>{counts.critical} ✕</span>
        </div>
      </div>

      <div className="device-cards">
        {devices.map(device => {
          const tel = latestTelemetry[device.id];
          const isSelected = selectedDeviceId === device.id;
          return (
            <div
              key={device.id}
              className={`device-card ${isSelected ? 'selected' : ''} status-${device.status.toLowerCase()}`}
              onClick={() => onSelectDevice(device.id)}
            >
              <div className="device-card-header">
                <span className="device-icon">{typeIcons[device.type] || '🚗'}</span>
                <div className="device-info">
                  <span className="device-name">{device.name}</span>
                  <span className="device-vid">{device.vehicle_id}</span>
                </div>
                <span
                  className="device-status-dot"
                  style={{ backgroundColor: statusColors[device.status] }}
                  title={device.status}
                />
              </div>

              {tel && (
                <div className="device-card-metrics">
                  <div className="mini-metric">
                    <span className="mini-label">SPD</span>
                    <span className="mini-value">{tel.speed?.toFixed(0) ?? '--'}</span>
                  </div>
                  <div className="mini-metric">
                    <span className="mini-label">TEMP</span>
                    <span className="mini-value">{(tel.engineTemp ?? tel.engine_temp)?.toFixed(0) ?? '--'}</span>
                  </div>
                  <div className="mini-metric">
                    <span className="mini-label">FUEL</span>
                    <span className="mini-value">{(tel.fuelLevel ?? tel.fuel_level)?.toFixed(0) ?? '--'}%</span>
                  </div>
                </div>
              )}

              {(userRole === 'Admin' || userRole === 'Operator') && (
                <button
                  className="btn-fault"
                  onClick={(e) => { e.stopPropagation(); onTriggerFault(device.id); }}
                  title="Inject engine fault for demo"
                >
                  ⚡ Inject Fault
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
