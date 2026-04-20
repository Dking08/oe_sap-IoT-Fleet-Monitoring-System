/**
 * Work Order Routes — Maintenance Workflow Management
 * SAP Workflow Service Simulation — approval flow transitions
 */
import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { workflowService } from '../services/workflow.service';
import { ROLES } from '../config/auth';

const router = Router();
router.use(authenticate);

/**
 * GET /api/workorders — List all work orders
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    let workOrders;
    // Technicians only see their assigned work orders
    if (req.user?.role === ROLES.TECHNICIAN) {
      workOrders = workflowService.getByTechnician(req.user.id);
    } else {
      workOrders = workflowService.getAll();
    }
    res.json(workOrders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/workorders/technicians — List available technicians
 */
router.get('/technicians', authorize(ROLES.ADMIN, ROLES.OPERATOR), (req: AuthRequest, res: Response) => {
  try {
    const technicians = workflowService.getTechnicians();
    res.json(technicians);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/workorders/:id — Get single work order
 */
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const wo = workflowService.getById(req.params.id);
    if (!wo) {
      res.status(404).json({ error: 'Work order not found' });
      return;
    }
    res.json(wo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/workorders/:id/approve — Approve work order (Admin only)
 * Workflow: Created → Approved
 */
router.patch('/:id/approve', authorize(ROLES.ADMIN), (req: AuthRequest, res: Response) => {
  try {
    const wo = workflowService.approve(req.params.id);
    res.json(wo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/workorders/:id/assign — Assign technician (Admin)
 * Workflow: Approved → Assigned
 */
router.patch('/:id/assign', authorize(ROLES.ADMIN, ROLES.OPERATOR), (req: AuthRequest, res: Response) => {
  try {
    const { technicianId } = req.body;
    if (!technicianId) {
      res.status(400).json({ error: 'technicianId required' });
      return;
    }
    const wo = workflowService.assign(req.params.id, technicianId);
    res.json(wo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/workorders/:id/start — Start work (Technician)
 * Workflow: Assigned → InProgress
 */
router.patch('/:id/start', authorize(ROLES.TECHNICIAN), (req: AuthRequest, res: Response) => {
  try {
    const wo = workflowService.startWork(req.params.id);
    res.json(wo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/workorders/:id/complete — Complete work order (Technician)
 * Workflow: InProgress → Completed
 */
router.patch('/:id/complete', authorize(ROLES.TECHNICIAN, ROLES.ADMIN), (req: AuthRequest, res: Response) => {
  try {
    const { resolutionNotes } = req.body;
    const wo = workflowService.complete(req.params.id, resolutionNotes);
    res.json(wo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
