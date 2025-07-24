import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createReview, getPerformerReviews } from '../controllers/reviews';

const router = Router();

// POST /api/reviews/:bookingId - Create review for completed booking (client only)
router.post('/:bookingId', authenticateToken, createReview);

// GET /api/reviews/:performerId - Get reviews for a performer (public)
router.get('/:performerId', getPerformerReviews);

export default router;
