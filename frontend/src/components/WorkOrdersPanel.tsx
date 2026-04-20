/**
 * Work Orders Panel - Maintenance Workflow Management
 * Implements the SAP Workflow approval flow UI:
 * Created -> Approved -> Assigned -> InProgress -> Completed
 */
import { useState, useEffect } from 'react';
import { WorkOrder } from '../types';
import { api } from '../services/api';

interface WorkOrdersPanelProps {
  workOrders: WorkOrder[];
  userRole: string;
  userId: string;
  onRefresh: () => void;
}

const statusFlow = ['Created', 'Approved', 'Assigned', 'InProgress', 'Completed'];
const statusColors: Record<string, string> = {
  Created: '#42a5f5',
  Approved: '#ab47bc',
  Assigned: '#ffa726',
  InProgress: '#26c6da',
  Completed: '#66bb6a',
};

const priorityColors: Record<string, string> = {
  Low: '#78909c',
  Medium: '#42a5f5',
  High: '#ffa726',
  Critical: '#ef5350',
};

export default function WorkOrdersPanel({ workOrders, userRole, userId, onRefresh }: WorkOrdersPanelProps) {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userRole === 'Admin' || userRole === 'Operator') {
      api.workOrders.getTechnicians().then(setTechnicians).catch(() => {});
    }
  }, [userRole]);

  const handleApprove = async (id: string) => {
    try { await api.workOrders.approve(id); onRefresh(); } catch (err: any) { alert(err.message); }
  };

  const handleAssign = async (id: string) => {
    const techId = selectedTech[id];
    if (!techId) { alert('Select a technician first'); return; }
    try { await api.workOrders.assign(id, techId); onRefresh(); } catch (err: any) { alert(err.message); }
  };

  const handleStart = async (id: string) => {
    try { await api.workOrders.start(id); onRefresh(); } catch (err: any) { alert(err.message); }
  };

  const handleComplete = async (id: string) => {
    const notes = prompt('Resolution notes:');
    if (notes === null) return;
    try { await api.workOrders.complete(id, notes || 'Completed'); onRefresh(); } catch (err: any) { alert(err.message); }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return '--';
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  };

  return (
    <div className="workorders-panel">
      <div className="panel-header">
        <h3>Maintenance Orders</h3>
        <span className="panel-count">{workOrders.filter(w => w.status !== 'Completed').length} active</span>
      </div>

      <div className="workorders-list">
        {workOrders.length === 0 ? (
          <div className="empty-list">
            <svg className="empty-list-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p>No work orders yet</p>
          </div>
        ) : (
          workOrders.map((wo) => (
            <div key={wo.id} className={`wo-item wo-status-${wo.status.toLowerCase()}`}>
              <div className="wo-header">
                <div className="wo-device">
                  <span className="wo-device-name">{wo.device_name}</span>
                  <span className="wo-device-vid">{wo.vehicle_id}</span>
                </div>
                <div className="wo-badges">
                  <span className="wo-priority" style={{ backgroundColor: priorityColors[wo.priority] + '22', color: priorityColors[wo.priority] }}>
                    {wo.priority}
                  </span>
                  <span className="wo-status" style={{ backgroundColor: statusColors[wo.status] + '22', color: statusColors[wo.status] }}>
                    {wo.status}
                  </span>
                </div>
              </div>

              <p className="wo-description">{wo.description}</p>

              {/* Workflow Progress Bar */}
              <div className="wo-progress">
                {statusFlow.map((step, i) => {
                  const currentIdx = statusFlow.indexOf(wo.status);
                  const isDone = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step} className={`wo-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="wo-step-dot" style={{ backgroundColor: isDone ? statusColors[wo.status] : '#2a3f5f' }} />
                      <span className="wo-step-label">{step === 'InProgress' ? 'In Progress' : step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons based on role and current status */}
              <div className="wo-actions">
                {wo.technician_name && (
                  <span className="wo-technician">Assigned: {wo.technician_name}</span>
                )}

                {wo.status === 'Created' && userRole === 'Admin' && (
                  <button className="btn-wo btn-approve" onClick={() => handleApprove(wo.id)}>
                    Approve
                  </button>
                )}

                {(wo.status === 'Created' || wo.status === 'Approved') && (userRole === 'Admin' || userRole === 'Operator') && (
                  <div className="assign-group">
                    <select
                      value={selectedTech[wo.id] || ''}
                      onChange={(e) => setSelectedTech(prev => ({ ...prev, [wo.id]: e.target.value }))}
                      className="select-tech"
                    >
                      <option value="">Select technician...</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                    <button className="btn-wo btn-assign" onClick={() => handleAssign(wo.id)}>
                      Assign
                    </button>
                  </div>
                )}

                {wo.status === 'Assigned' && (userRole === 'Technician' || userRole === 'Admin') && (
                  <button className="btn-wo btn-start" onClick={() => handleStart(wo.id)}>
                    Start Work
                  </button>
                )}

                {(wo.status === 'Assigned' || wo.status === 'InProgress') && (userRole === 'Technician' || userRole === 'Admin') && (
                  <button className="btn-wo btn-complete" onClick={() => handleComplete(wo.id)}>
                    Complete
                  </button>
                )}

                {wo.resolution_notes && (
                  <span className="wo-notes">Note: {wo.resolution_notes}</span>
                )}

                <span className="wo-time">{formatTime(wo.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
