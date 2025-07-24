import { Router } from 'express';
import { getRefunds, processManualRefund } from '../controllers/refunds';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

/**
 * Admin-only refund management routes
 * All routes require authentication and admin privileges
 */

// Get all refunds with filtering (Admin only)
router.get('/', authenticateToken, requireAdmin, getRefunds);

// Process manual refund for a booking (Admin only)
router.post('/:bookingId/manual', authenticateToken, requireAdmin, processManualRefund);

export default router;
