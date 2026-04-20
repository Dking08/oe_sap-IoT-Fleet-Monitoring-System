/**
 * Device Routes — Fleet Vehicle Management
 * SAP O2C Pattern: SalesOrders CRUD
 */
import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { deviceService } from '../services/device.service';
import { ROLES } from '../config/auth';

const router = Router();

// All device routes require authentication
router.use(authenticate);

/**
 * GET /api/devices — List all vehicles in the fleet
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const devices = deviceService.getAll();
    res.json(devices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/devices/summary — Fleet summary statistics
 */
router.get('/summary', (req: AuthRequest, res: Response) => {
  try {
    const summary = deviceService.getFleetSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/devices/:id — Get single vehicle details
 */
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const device = deviceService.getById(req.params.id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/devices — Register new vehicle (Admin only)
 */
router.post('/', authorize(ROLES.ADMIN), (req: AuthRequest, res: Response) => {
  try {
    const device = deviceService.create(req.body);
    res.status(201).json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/devices/:id — Update vehicle details (Admin only)
 */
router.patch('/:id', authorize(ROLES.ADMIN), (req: AuthRequest, res: Response) => {
  try {
    const device = deviceService.update(req.params.id, req.body);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
