import { Router } from 'express';
import { getMe } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

export default router;
