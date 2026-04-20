/**
 * Event Mesh Subscribers — Channel Handlers
 * Wires Event Mesh channels to the correct CAP-like service handlers.
 * 
 * Channels:
 *   telemetry  → TelemetryService.processTelemetry
 *   alerts     → AlertService.processAlert
 *   maintenance → WorkflowService.createWorkOrder
 */
import { eventMesh } from '../config/event-mesh';
import { telemetryService } from '../services/telemetry.service';
import { alertService } from '../services/alert.service';
import { workflowService } from '../services/workflow.service';

export function initializeSubscribers(): void {
  // Channel: telemetry — Vehicle telemetry data stream
  eventMesh.subscribe('telemetry', (data) => {
    try {
      telemetryService.processTelemetry(data);
    } catch (error: any) {
      console.error('[Subscriber:telemetry] Error:', error.message);
    }
  });

  // Channel: alerts — Threshold breach notifications
  eventMesh.subscribe('alerts', (data) => {
    try {
      alertService.processAlert(data);
    } catch (error: any) {
      console.error('[Subscriber:alerts] Error:', error.message);
    }
  });

  // Channel: maintenance — Work order creation triggers
  eventMesh.subscribe('maintenance', (data) => {
    try {
      workflowService.createWorkOrder(data);
    } catch (error: any) {
      console.error('[Subscriber:maintenance] Error:', error.message);
    }
  });

  console.log('[Event Mesh] All subscribers initialized');
  console.log('[Event Mesh] Channels:', eventMesh.getChannelInfo());
}
