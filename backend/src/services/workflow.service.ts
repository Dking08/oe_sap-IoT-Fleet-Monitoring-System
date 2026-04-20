/**
 * SAP Workflow Service Simulation
 * SAP O2C Pattern: Invoice Workers → Maintenance Worker
 * Implements: Created → Approved → Assigned → InProgress → Completed
 */
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../config/database';
import { broadcastUpdate } from '../websocket/ws-server';

class WorkflowService {
  createWorkOrder(data: { deviceId: string; alertId: string; priority: string; description: string }): void {
    const existing = queryOne('SELECT id FROM work_orders WHERE alert_id = ?', [data.alertId]);
    if (existing) return;

    const id = uuidv4();
    execute(
      `INSERT INTO work_orders (id, device_id, alert_id, status, priority, description, created_at, updated_at) VALUES (?, ?, ?, 'Created', ?, ?, datetime('now'), datetime('now'))`,
      [id, data.deviceId, data.alertId, data.priority, data.description]
    );

    const workOrder = this.getById(id);
    broadcastUpdate('workorder', workOrder);
    console.log(`[Workflow] Work order created: ${id} (status: Created)`);
  }

  getAll(): any[] {
    return queryAll(`
      SELECT wo.*, d.vehicle_id, d.name as device_name,
             u.full_name as technician_name, u.username as technician_username
      FROM work_orders wo
      JOIN devices d ON wo.device_id = d.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      ORDER BY wo.created_at DESC
    `);
  }

  getById(id: string): any {
    return queryOne(`
      SELECT wo.*, d.vehicle_id, d.name as device_name,
             u.full_name as technician_name, u.username as technician_username
      FROM work_orders wo
      JOIN devices d ON wo.device_id = d.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      WHERE wo.id = ?
    `, [id]);
  }

  approve(id: string): any {
    const wo = this.getById(id);
    if (!wo) throw new Error('Work order not found');
    if (wo.status !== 'Created') throw new Error(`Cannot approve: current status is ${wo.status}`);

    execute(`UPDATE work_orders SET status = 'Approved', updated_at = datetime('now') WHERE id = ?`, [id]);
    const updated = this.getById(id);
    broadcastUpdate('workorder_updated', updated);
    console.log(`[Workflow] Work order ${id}: Created → Approved`);
    return updated;
  }

  assign(id: string, technicianId: string): any {
    const wo = this.getById(id);
    if (!wo) throw new Error('Work order not found');
    if (wo.status !== 'Approved' && wo.status !== 'Created')
      throw new Error(`Cannot assign: current status is ${wo.status}`);

    const technician = queryOne('SELECT id, full_name FROM users WHERE id = ? AND role = ?', [technicianId, 'Technician']);
    if (!technician) throw new Error('Technician not found');

    execute(`UPDATE work_orders SET status = 'Assigned', assigned_to = ?, updated_at = datetime('now') WHERE id = ?`, [technicianId, id]);
    const updated = this.getById(id);
    broadcastUpdate('workorder_updated', updated);
    console.log(`[Workflow] Work order ${id}: → Assigned to ${technician.full_name}`);
    return updated;
  }

  startWork(id: string): any {
    const wo = this.getById(id);
    if (!wo) throw new Error('Work order not found');
    if (wo.status !== 'Assigned') throw new Error(`Cannot start: current status is ${wo.status}`);

    execute(`UPDATE work_orders SET status = 'InProgress', updated_at = datetime('now') WHERE id = ?`, [id]);
    const updated = this.getById(id);
    broadcastUpdate('workorder_updated', updated);
    console.log(`[Workflow] Work order ${id}: Assigned → InProgress`);
    return updated;
  }

  complete(id: string, resolutionNotes?: string): any {
    const wo = this.getById(id);
    if (!wo) throw new Error('Work order not found');
    if (wo.status !== 'InProgress' && wo.status !== 'Assigned')
      throw new Error(`Cannot complete: current status is ${wo.status}`);

    execute(
      `UPDATE work_orders SET status = 'Completed', resolution_notes = ?, updated_at = datetime('now'), completed_at = datetime('now') WHERE id = ?`,
      [resolutionNotes || 'Completed', id]
    );
    const updated = this.getById(id);
    broadcastUpdate('workorder_updated', updated);
    console.log(`[Workflow] Work order ${id}: → Completed`);
    return updated;
  }

  getByTechnician(technicianId: string): any[] {
    return queryAll(`
      SELECT wo.*, d.vehicle_id, d.name as device_name
      FROM work_orders wo JOIN devices d ON wo.device_id = d.id
      WHERE wo.assigned_to = ? ORDER BY wo.created_at DESC
    `, [technicianId]);
  }

  getTechnicians(): any[] {
    return queryAll("SELECT id, username, full_name FROM users WHERE role = 'Technician'");
  }
}

export const workflowService = new WorkflowService();
