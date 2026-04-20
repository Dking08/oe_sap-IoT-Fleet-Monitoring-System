/**
 * SAP Event Mesh Simulation
 * Uses Node.js EventEmitter to simulate SAP Event Mesh pub/sub channels.
 * Channels mirror SAP Event Mesh topics:
 *   - telemetry: Vehicle telemetry data stream
 *   - alerts: Threshold breach notifications
 *   - maintenance: Work order creation triggers
 */
import { EventEmitter } from 'events';

class EventMesh extends EventEmitter {
  private static instance: EventMesh;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Singleton pattern — mirrors Event Mesh service instance binding
   */
  static getInstance(): EventMesh {
    if (!EventMesh.instance) {
      EventMesh.instance = new EventMesh();
      console.log('[Event Mesh] Service instance created');
    }
    return EventMesh.instance;
  }

  /**
   * Publish message to a named channel (topic)
   */
  publish(channel: string, data: any): void {
    this.emit(channel, data);
  }

  /**
   * Subscribe to a named channel (topic)
   */
  subscribe(channel: string, handler: (data: any) => void): void {
    this.on(channel, handler);
    console.log(`[Event Mesh] Subscribed to channel: ${channel}`);
  }

  /**
   * Get channel statistics
   */
  getChannelInfo(): Record<string, number> {
    const channels = ['telemetry', 'alerts', 'maintenance'];
    const info: Record<string, number> = {};
    channels.forEach(ch => {
      info[ch] = this.listenerCount(ch);
    });
    return info;
  }
}

export const eventMesh = EventMesh.getInstance();
