import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createEnquiry,
  getEnquiry,
  listEnquiries,
  updateEnquiryStatus
} from '../controllers/enquiries';

const router = Router();

// All enquiry routes require authentication
router.use(authenticateToken);

// POST /api/enquiries - Create new enquiry (client only)
router.post('/', createEnquiry);

// GET /api/enquiries - List enquiries (filtered by user role)
router.get('/', listEnquiries);

// GET /api/enquiries/:id - Get specific enquiry (client or performer)
router.get('/:id', getEnquiry);

// PATCH /api/enquiries/:id - Update enquiry status (performer only)
router.patch('/:id', updateEnquiryStatus);

export default router;
