/**
 * CAP-like Device Service
 * SAP O2C Pattern: SalesOrders → Devices (fleet vehicles)
 */
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../config/database';

class DeviceService {
  getAll(): any[] {
    return queryAll('SELECT * FROM devices ORDER BY vehicle_id');
  }

  getById(id: string): any {
    const device = queryOne('SELECT * FROM devices WHERE id = ?', [id]);
    if (!device) return null;

    const latestTelemetry = queryOne(
      'SELECT * FROM telemetry WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1', [id]
    );

    return { ...device, latestTelemetry };
  }

  create(data: { vehicleId: string; name: string; type: string; latitude?: number; longitude?: number }): any {
    const id = uuidv4();
    execute(
      'INSERT INTO devices (id, vehicle_id, name, type, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.vehicleId, data.name, data.type, data.latitude || 0, data.longitude || 0]
    );
    return this.getById(id);
  }

  update(id: string, data: Partial<{ name: string; type: string; status: string }>): any {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.type) { fields.push('type = ?'); values.push(data.type); }
    if (data.status) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    execute(`UPDATE devices SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  getFleetSummary(): any {
    const total = queryOne('SELECT COUNT(*) as count FROM devices');
    const byStatus = queryAll('SELECT status, COUNT(*) as count FROM devices GROUP BY status');

    return {
      total: total?.count || 0,
      byStatus: byStatus.reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
    };
  }
}

export const deviceService = new DeviceService();
