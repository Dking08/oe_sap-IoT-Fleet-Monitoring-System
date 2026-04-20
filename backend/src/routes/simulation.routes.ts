/**
 * Simulation Routes — Telemetry Simulator Controls
 * Start/stop simulation and trigger faults for demo purposes
 */
import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { telemetryGenerator } from '../simulator/telemetry-generator';
import { ROLES } from '../config/auth';

const router = Router();
router.use(authenticate);

/**
 * POST /api/simulation/start — Start telemetry simulation
 */
router.post('/start', authorize(ROLES.ADMIN, ROLES.OPERATOR), (req: AuthRequest, res: Response) => {
  try {
    telemetryGenerator.start();
    res.json({ status: 'running', message: 'Telemetry simulation started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulation/stop — Stop telemetry simulation
 */
router.post('/stop', authorize(ROLES.ADMIN, ROLES.OPERATOR), (req: AuthRequest, res: Response) => {
  try {
    telemetryGenerator.stop();
    res.json({ status: 'stopped', message: 'Telemetry simulation stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulation/status — Check simulator status
 */
router.get('/status', (req: AuthRequest, res: Response) => {
  res.json({
    running: telemetryGenerator.isRunning(),
    vehicleCount: telemetryGenerator.getVehicleCount(),
  });
});

/**
 * POST /api/simulation/trigger-fault/:deviceId — Inject fault into a device
 * Forces engine temperature to spike above critical threshold for demo
 */
router.post('/trigger-fault/:deviceId', authorize(ROLES.ADMIN, ROLES.OPERATOR), (req: AuthRequest, res: Response) => {
  try {
    const success = telemetryGenerator.injectFault(req.params.deviceId);
    if (!success) {
      res.status(404).json({ error: 'Device not found in simulator' });
      return;
    }
    res.json({
      message: `Fault injected into device ${req.params.deviceId} — engine temperature will spike`,
      duration: '30 seconds',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
