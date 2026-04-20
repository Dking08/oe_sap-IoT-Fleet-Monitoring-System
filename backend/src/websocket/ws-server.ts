/**
 * WebSocket Server — Real-time Push to Dashboard
 * Broadcasts telemetry updates, alerts, and work order changes
 */
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;

/**
 * Initialize WebSocket server attached to HTTP server
 */
export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log(`[WebSocket] Client connected (total: ${wss.clients.size})`);

    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to SAP BTP Fleet Monitor — Event Stream' },
      timestamp: new Date().toISOString(),
    }));

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected (total: ${wss.clients.size})`);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error.message);
    });
  });

  console.log('[WebSocket] Server initialized on /ws');
}

/**
 * Broadcast update to all connected clients
 * Used by services to push real-time updates to the dashboard
 */
export function broadcastUpdate(type: string, data: any): void {
  if (!wss) return;

  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
