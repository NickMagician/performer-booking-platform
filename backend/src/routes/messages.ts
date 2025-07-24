import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createOrGetThread,
  getUserThreads,
  getThread,
  sendMessage,
  markMessageAsRead
} from '../controllers/messages';

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

// Thread routes
router.post('/threads/:enquiryId', createOrGetThread);      // Create or get thread for enquiry
router.get('/threads', getUserThreads);                     // Get all threads for user
router.get('/threads/:id', getThread);                      // Get specific thread with messages
router.post('/threads/:id/messages', sendMessage);          // Send message to thread

// Message routes
router.patch('/messages/:id/read', markMessageAsRead);      // Mark message as read

export default router;
