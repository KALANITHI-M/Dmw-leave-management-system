import express from 'express';
import { protect, hrOnly } from '../middleware/auth.js';
import * as profileChangeRequestController from '../controllers/profileChangeRequestController.js';

const router = express.Router();

// Create new profile change request (authenticated users)
router.post('/', protect, profileChangeRequestController.createRequest);

// Get all requests (HR only)
router.get('/', protect, hrOnly, profileChangeRequestController.getAllRequests);

// Get my requests (authenticated users)
router.get('/my-requests', protect, profileChangeRequestController.getMyRequests);

// Get request by ID
router.get('/:id', protect, profileChangeRequestController.getRequestById);

// Approve request (HR only)
router.put('/:id/approve', protect, hrOnly, profileChangeRequestController.approveRequest);

// Reject request (HR only)
router.put('/:id/reject', protect, hrOnly, profileChangeRequestController.rejectRequest);

export default router;
