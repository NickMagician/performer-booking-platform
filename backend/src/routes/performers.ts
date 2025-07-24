import { Router } from 'express';
import { 
  createPerformer, 
  getPerformer, 
  updatePerformer, 
  getPerformers 
} from '../controllers/performers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/performers
 * @desc    List/search performers with filtering and pagination
 * @access  Public
 */
router.get('/', getPerformers);

/**
 * @route   POST /api/performers
 * @desc    Create performer profile
 * @access  Private (Performers only)
 */
router.post('/', authenticate, authorize('PERFORMER'), createPerformer);

/**
 * @route   GET /api/performers/:id
 * @desc    Get performer profile by ID
 * @access  Public
 */
router.get('/:id', getPerformer);

/**
 * @route   PUT /api/performers/:id
 * @desc    Update performer profile
 * @access  Private (Performer owner or Admin)
 */
router.put('/:id', authenticate, updatePerformer);

export default router;
