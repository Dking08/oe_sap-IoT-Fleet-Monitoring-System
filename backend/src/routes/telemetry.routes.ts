/**
 * Telemetry Routes — Vehicle Telemetry Data
 * SAP O2C Pattern: SalesOrderItems read access
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { telemetryService } from '../services/telemetry.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/telemetry/latest — Latest telemetry for all devices
 */
router.get('/latest', (req: AuthRequest, res: Response) => {
  try {
    const data = telemetryService.getLatestAll();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/telemetry/device/:deviceId — Telemetry history for device
 */
router.get('/device/:deviceId', (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = telemetryService.getByDevice(req.params.deviceId, limit);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
