/**
 * Device List - Sidebar showing all fleet vehicles
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

function VehicleIcon({ type }: { type: string }) {
  const svgProps = {
    width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (type === 'Truck') return (
    <svg {...svgProps}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
  if (type === 'Van') return (
    <svg {...svgProps}>
      <path d="M3 4h14l4 7v5a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" />
      <circle cx="7.5" cy="18" r="2" />
      <circle cx="16.5" cy="18" r="2" />
      <line x1="9.5" y1="18" x2="14.5" y2="18" />
    </svg>
  );
  return (
    <svg {...svgProps}>
      <path d="M5 17a2 2 0 01-2-2v-2a1 1 0 01.1-.45L6 7h12l2.9 5.55a1 1 0 01.1.45v2a2 2 0 01-2 2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

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
          <span className="stat" style={{ color: '#ffa726' }}>{counts.warning} W</span>
          <span className="stat" style={{ color: '#ef5350' }}>{counts.critical} C</span>
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
                <span className="device-icon">
                  <VehicleIcon type={device.type} />
                </span>
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
                  Inject Fault
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
