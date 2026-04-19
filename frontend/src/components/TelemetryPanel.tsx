/**
 * Telemetry Panel — Live vehicle metrics display
 * Shows gauges for speed, fuel, engine temp, battery, GPS, odometer
 */
import { Device, TelemetryData } from '../types';

interface TelemetryPanelProps {
  device: Device | null;
  telemetry: TelemetryData | null;
}

function GaugeCard({ label, value, unit, min, max, warningAt, criticalAt, inverse }: {
  label: string; value: number; unit: string;
  min: number; max: number; warningAt: number; criticalAt: number; inverse?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  let color = '#66bb6a'; // OK green
  if (inverse) {
    if (value < criticalAt) color = '#ef5350';
    else if (value < warningAt) color = '#ffa726';
  } else {
    if (value > criticalAt) color = '#ef5350';
    else if (value > warningAt) color = '#ffa726';
  }

  return (
    <div className="gauge-card">
      <div className="gauge-label">{label}</div>
      <div className="gauge-value" style={{ color }}>
        {value.toFixed(1)}
        <span className="gauge-unit">{unit}</span>
      </div>
      <div className="gauge-bar-track">
        <div
          className="gauge-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="gauge-range">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function TelemetryPanel({ device, telemetry }: TelemetryPanelProps) {
  if (!device) {
    return (
      <div className="telemetry-panel empty-panel">
        <div className="empty-state">
          <span className="empty-icon">📡</span>
          <h3>Select a Vehicle</h3>
          <p>Click on a vehicle in the sidebar to view live telemetry data</p>
        </div>
      </div>
    );
  }

  const speed = telemetry?.speed ?? 0;
  const fuel = telemetry?.fuelLevel ?? telemetry?.fuel_level ?? 0;
  const temp = telemetry?.engineTemp ?? telemetry?.engine_temp ?? 0;
  const battery = telemetry?.batteryVoltage ?? telemetry?.battery_voltage ?? 0;
  const lat = telemetry?.latitude ?? device.latitude;
  const lon = telemetry?.longitude ?? device.longitude;
  const odometer = telemetry?.odometer ?? 0;

  const statusColors: Record<string, string> = {
    OK: '#66bb6a', Warning: '#ffa726', Critical: '#ef5350', Offline: '#78909c',
  };

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <div className="telemetry-device-info">
          <h2>{device.name}</h2>
          <span className="device-vid-tag">{device.vehicle_id} • {device.type}</span>
        </div>
        <div className="telemetry-status" style={{ backgroundColor: statusColors[device.status] + '22', color: statusColors[device.status], borderColor: statusColors[device.status] }}>
          <span className="status-pulse" style={{ backgroundColor: statusColors[device.status] }} />
          {device.status}
        </div>
      </div>

      <div className="gauges-grid">
        <GaugeCard label="Speed" value={speed} unit=" km/h" min={0} max={160} warningAt={100} criticalAt={130} />
        <GaugeCard label="Engine Temp" value={temp} unit=" °C" min={50} max={140} warningAt={95} criticalAt={105} />
        <GaugeCard label="Fuel Level" value={fuel} unit=" %" min={0} max={100} warningAt={15} criticalAt={5} inverse />
        <GaugeCard label="Battery" value={battery} unit=" V" min={9} max={15} warningAt={11.5} criticalAt={10.5} inverse />
      </div>

      <div className="telemetry-extra">
        <div className="info-card">
          <span className="info-label">📍 GPS Coordinates</span>
          <span className="info-value">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
        </div>
        <div className="info-card">
          <span className="info-label">🛣️ Odometer</span>
          <span className="info-value">{odometer.toLocaleString()} km</span>
        </div>
        <div className="info-card">
          <span className="info-label">🕐 Last Seen</span>
          <span className="info-value">
            {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}
