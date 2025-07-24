import { Router } from 'express';
import { jwtAuth } from '../middleware/auth';
import { 
  createOnboardingLink, 
  getAccountStatus, 
  handleOnboardingReturn,
  getPayouts,
  triggerManualPayout
} from '../controllers/payments';

const router = Router();

// All payment routes require authentication
// router.use(authenticateToken);

/**
 * @route   GET /api/payments/onboard
 * @desc    Create Stripe Connect onboarding link for performers
 * @access  Private (Performer only)
 */
router.get('/onboard', jwtAuth, createOnboardingLink as any);

/**
 * @route   GET /api/payments/account-status
 * @desc    Get Stripe Connect account status for performer
 * @access  Private (Performer only)
 */
router.get('/account-status', jwtAuth, getAccountStatus as any);

/**
 * @route   GET /api/payments/onboard-return
 * @desc    Handle return from Stripe Connect onboarding
 * @access  Private (Performer only)
 */
router.get('/onboard-return', jwtAuth, handleOnboardingReturn as any);

/**
 * @route   GET /api/payments/payouts
 * @desc    Get payout history (performer sees own, admin sees all)
 * @access  Private (Performer/Admin)
 */
router.get('/payouts', jwtAuth, getPayouts);

/**
 * @route   POST /api/payments/manual-payout/:bookingId
 * @desc    Trigger manual payout for specific booking
 * @access  Private (Admin only)
 */
router.post('/manual-payout/:bookingId', jwtAuth, triggerManualPayout);

export default router;
