/**
 * Alert Routes — Threshold Breach Alerts
 * SAP O2C Pattern: Delivery monitoring alerts
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { alertService } from '../services/alert.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/alerts — All alerts (most recent first)
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const alerts = alertService.getAll(limit);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/stats — Alert statistics
 */
router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    res.json(alertService.getStats());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/device/:deviceId — Alerts for specific device
 */
router.get('/device/:deviceId', (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = alertService.getByDevice(req.params.deviceId, limit);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/alerts/:id/acknowledge — Acknowledge alert
 */
router.patch('/:id/acknowledge', (req: AuthRequest, res: Response) => {
  try {
    const alert = alertService.acknowledge(req.params.id);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
