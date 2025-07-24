import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  confirmBooking,
  listBookings,
  getBooking
} from '../controllers/bookings';
import { cancelBooking } from '../controllers/bookings-cancel';

const router = Router();

// All booking routes require authentication
router.use(authenticateToken);

// GET /api/bookings - List bookings (filtered by user role)
router.get('/', listBookings);

// GET /api/bookings/:id - Get specific booking (client or performer)
router.get('/:id', getBooking);

// POST /api/bookings/:enquiryId/confirm - Confirm enquiry to booking (performer only)
router.post('/:enquiryId/confirm', confirmBooking);

// POST /api/bookings/:id/cancel - Cancel booking (client only)
router.post('/:id/cancel', cancelBooking);

export default router;
