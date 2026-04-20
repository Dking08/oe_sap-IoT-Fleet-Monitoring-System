/**
 * Server Entry Point — SAP BTP Simulation
 * Student: Dastageer - 23053275 | Course: OE - SAP_BTP
 */
import express from 'express';
import cors from 'cors';
import http from 'http';

import { initializeDatabase } from './config/database';
import { initWebSocket } from './websocket/ws-server';
import { initializeSubscribers } from './events/subscribers';

import authRoutes from './routes/auth.routes';
import deviceRoutes from './routes/device.routes';
import telemetryRoutes from './routes/telemetry.routes';
import alertRoutes from './routes/alert.routes';
import workorderRoutes from './routes/workorder.routes';
import simulationRoutes from './routes/simulation.routes';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Request logging (skip noisy telemetry)
  app.use((req, _res, next) => {
    if (!req.path.startsWith('/api/telemetry') && !req.path.startsWith('/ws')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/telemetry', telemetryRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/workorders', workorderRoutes);
  app.use('/api/simulation', simulationRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'IoT Fleet Monitor — SAP BTP Simulation',
      student: 'Dastageer - 23053275',
      course: 'OE - SAP_BTP',
      timestamp: new Date().toISOString(),
    });
  });

  const server = http.createServer(app);

  // Initialize HANA simulation (SQLite via sql.js — async)
  await initializeDatabase();

  // Initialize WebSocket server
  initWebSocket(server);

  // Initialize Event Mesh subscribers
  initializeSubscribers();

  server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  IoT Fleet Monitoring System — SAP BTP Simulation');
    console.log('  Student: Dastageer - 23053275 | Course: OE - SAP_BTP');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Server:    http://localhost:${PORT}`);
    console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`  Health:    http://localhost:${PORT}/api/health`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
