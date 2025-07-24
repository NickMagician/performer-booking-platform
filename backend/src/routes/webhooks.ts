import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhooks';

const router = Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but secured with Stripe signature verification)
 * @note    Raw body parsing is handled in main app before this route
 */
router.post('/stripe', handleStripeWebhook);

export default router;
