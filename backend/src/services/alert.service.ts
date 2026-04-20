/**
 * CAP-like Alert Service
 * SAP O2C Pattern: Delivery Workers → Alert Processor
 */
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../config/database';
import { eventMesh } from '../config/event-mesh';
import { broadcastUpdate } from '../websocket/ws-server';

class AlertService {
  processAlert(data: any): void {
    const id = uuidv4();
    execute(
      `INSERT INTO alerts (id, device_id, telemetry_id, severity, metric, threshold, actual_value, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, data.deviceId, data.telemetryId, data.severity, data.metric, data.threshold, data.actualValue, data.message]
    );

    const device = queryOne('SELECT vehicle_id, name FROM devices WHERE id = ?', [data.deviceId]);
    const alert = {
      id, ...data,
      vehicle_id: device?.vehicle_id,
      device_name: device?.name,
      acknowledged: 0,
      created_at: new Date().toISOString(),
    };

    broadcastUpdate('alert', alert);

    if (data.severity === 'critical') {
      console.log(`[Alert Service] Critical alert — triggering maintenance workflow for device ${data.deviceId}`);
      eventMesh.publish('maintenance', {
        deviceId: data.deviceId, alertId: id,
        priority: 'Critical', description: data.message,
      });
    }
  }

  getAll(limit = 100): any[] {
    return queryAll(
      `SELECT a.*, d.vehicle_id, d.name as device_name FROM alerts a JOIN devices d ON a.device_id = d.id ORDER BY a.created_at DESC LIMIT ?`,
      [limit]
    );
  }

  getByDevice(deviceId: string, limit = 50): any[] {
    return queryAll(
      `SELECT a.*, d.vehicle_id, d.name as device_name FROM alerts a JOIN devices d ON a.device_id = d.id WHERE a.device_id = ? ORDER BY a.created_at DESC LIMIT ?`,
      [deviceId, limit]
    );
  }

  acknowledge(alertId: string): any {
    execute('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [alertId]);
    const alert = queryOne(
      `SELECT a.*, d.vehicle_id, d.name as device_name FROM alerts a JOIN devices d ON a.device_id = d.id WHERE a.id = ?`,
      [alertId]
    );
    broadcastUpdate('alert_updated', alert);
    return alert;
  }

  getStats(): any {
    const total = queryOne('SELECT COUNT(*) as count FROM alerts');
    const unacknowledged = queryOne('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0');
    const bySeverity = queryAll('SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity');
    return {
      total: total?.count || 0,
      unacknowledged: unacknowledged?.count || 0,
      bySeverity: bySeverity.reduce((acc: any, row: any) => { acc[row.severity] = row.count; return acc; }, {}),
    };
  }
}

export const alertService = new AlertService();
