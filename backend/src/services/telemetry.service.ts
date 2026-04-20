/**
 * CAP-like Telemetry Service
 * SAP O2C Pattern: SalesOrderItems → Telemetry (readings per device)
 */
import { queryAll, queryOne, execute } from '../config/database';
import { eventMesh } from '../config/event-mesh';
import { broadcastUpdate } from '../websocket/ws-server';
import { THRESHOLDS } from '../config/auth';

interface TelemetryData {
  id: string;
  deviceId: string;
  vehicleId: string;
  speed: number;
  fuelLevel: number;
  engineTemp: number;
  latitude: number;
  longitude: number;
  batteryVoltage: number;
  odometer: number;
  recordedAt: string;
}

interface AlertTrigger {
  severity: 'warning' | 'critical';
  metric: string;
  threshold: number;
  actualValue: number;
  message: string;
}

class TelemetryService {
  processTelemetry(data: TelemetryData): void {
    // 1. Store telemetry
    execute(
      `INSERT INTO telemetry (id, device_id, speed, fuel_level, engine_temp, latitude, longitude, battery_voltage, odometer, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.deviceId, data.speed, data.fuelLevel, data.engineTemp, data.latitude, data.longitude, data.batteryVoltage, data.odometer, data.recordedAt]
    );

    // 2. Check thresholds
    const alerts: AlertTrigger[] = [];
    let status = 'OK';

    if (data.engineTemp > THRESHOLDS.engineTemp.critical) {
      status = 'Critical';
      alerts.push({ severity: 'critical', metric: 'engine_temp', threshold: THRESHOLDS.engineTemp.critical, actualValue: data.engineTemp, message: `Engine temperature CRITICAL: ${data.engineTemp}${THRESHOLDS.engineTemp.unit} (threshold: ${THRESHOLDS.engineTemp.critical}${THRESHOLDS.engineTemp.unit})` });
    } else if (data.engineTemp > THRESHOLDS.engineTemp.warning) {
      if (status !== 'Critical') status = 'Warning';
      alerts.push({ severity: 'warning', metric: 'engine_temp', threshold: THRESHOLDS.engineTemp.warning, actualValue: data.engineTemp, message: `Engine temperature WARNING: ${data.engineTemp}${THRESHOLDS.engineTemp.unit} (threshold: ${THRESHOLDS.engineTemp.warning}${THRESHOLDS.engineTemp.unit})` });
    }

    if (data.speed > THRESHOLDS.speed.critical) {
      status = 'Critical';
      alerts.push({ severity: 'critical', metric: 'speed', threshold: THRESHOLDS.speed.critical, actualValue: data.speed, message: `Speed CRITICAL: ${data.speed}${THRESHOLDS.speed.unit} (threshold: ${THRESHOLDS.speed.critical}${THRESHOLDS.speed.unit})` });
    } else if (data.speed > THRESHOLDS.speed.warning) {
      if (status !== 'Critical') status = 'Warning';
      alerts.push({ severity: 'warning', metric: 'speed', threshold: THRESHOLDS.speed.warning, actualValue: data.speed, message: `Speed WARNING: ${data.speed}${THRESHOLDS.speed.unit} (threshold: ${THRESHOLDS.speed.warning}${THRESHOLDS.speed.unit})` });
    }

    if (data.fuelLevel < THRESHOLDS.fuelLevel.criticalBelow) {
      status = 'Critical';
      alerts.push({ severity: 'critical', metric: 'fuel_level', threshold: THRESHOLDS.fuelLevel.criticalBelow, actualValue: data.fuelLevel, message: `Fuel level CRITICAL: ${data.fuelLevel}${THRESHOLDS.fuelLevel.unit} (threshold: ${THRESHOLDS.fuelLevel.criticalBelow}${THRESHOLDS.fuelLevel.unit})` });
    } else if (data.fuelLevel < THRESHOLDS.fuelLevel.warningBelow) {
      if (status !== 'Critical') status = 'Warning';
      alerts.push({ severity: 'warning', metric: 'fuel_level', threshold: THRESHOLDS.fuelLevel.warningBelow, actualValue: data.fuelLevel, message: `Fuel level WARNING: ${data.fuelLevel}${THRESHOLDS.fuelLevel.unit} (threshold: ${THRESHOLDS.fuelLevel.warningBelow}${THRESHOLDS.fuelLevel.unit})` });
    }

    if (data.batteryVoltage < THRESHOLDS.batteryVoltage.criticalBelow) {
      status = 'Critical';
      alerts.push({ severity: 'critical', metric: 'battery_voltage', threshold: THRESHOLDS.batteryVoltage.criticalBelow, actualValue: data.batteryVoltage, message: `Battery voltage CRITICAL: ${data.batteryVoltage}${THRESHOLDS.batteryVoltage.unit} (threshold: ${THRESHOLDS.batteryVoltage.criticalBelow}${THRESHOLDS.batteryVoltage.unit})` });
    } else if (data.batteryVoltage < THRESHOLDS.batteryVoltage.warningBelow) {
      if (status !== 'Critical') status = 'Warning';
      alerts.push({ severity: 'warning', metric: 'battery_voltage', threshold: THRESHOLDS.batteryVoltage.warningBelow, actualValue: data.batteryVoltage, message: `Battery voltage WARNING: ${data.batteryVoltage}${THRESHOLDS.batteryVoltage.unit} (threshold: ${THRESHOLDS.batteryVoltage.warningBelow}${THRESHOLDS.batteryVoltage.unit})` });
    }

    // 3. Update device
    execute(
      `UPDATE devices SET status = ?, latitude = ?, longitude = ?, last_seen = ? WHERE id = ?`,
      [status, data.latitude, data.longitude, data.recordedAt, data.deviceId]
    );

    // 4. Broadcast via WebSocket
    broadcastUpdate('telemetry', { ...data, status });

    // 5. Publish alerts
    alerts.forEach(alert => {
      eventMesh.publish('alerts', { ...alert, deviceId: data.deviceId, telemetryId: data.id });
    });
  }

  getLatestAll(): any[] {
    return queryAll(`
      SELECT t.*, d.vehicle_id, d.name as device_name, d.status as device_status
      FROM telemetry t
      INNER JOIN (SELECT device_id, MAX(recorded_at) as max_recorded FROM telemetry GROUP BY device_id) latest
      ON t.device_id = latest.device_id AND t.recorded_at = latest.max_recorded
      JOIN devices d ON t.device_id = d.id
    `);
  }

  getByDevice(deviceId: string, limit = 50): any[] {
    return queryAll('SELECT * FROM telemetry WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?', [deviceId, limit]);
  }

  getLatestByDevice(deviceId: string): any {
    return queryOne('SELECT * FROM telemetry WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1', [deviceId]);
  }
}

export const telemetryService = new TelemetryService();
