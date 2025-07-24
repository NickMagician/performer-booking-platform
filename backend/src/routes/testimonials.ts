import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { createTestimonial, getPerformerTestimonials, toggleFeaturedTestimonial } from '../controllers/testimonials';

const router = Router();

// POST /api/testimonials - Create testimonial (admin only)
router.post('/', authenticateToken, requireAdmin, createTestimonial);

// GET /api/testimonials/:performerId - Get testimonials for a performer (public)
router.get('/:performerId', getPerformerTestimonials);

// PATCH /api/testimonials/:testimonialId/featured - Toggle featured status (admin only)
router.patch('/:testimonialId/featured', authenticateToken, requireAdmin, toggleFeaturedTestimonial);

export default router;
