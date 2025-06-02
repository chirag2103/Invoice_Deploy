import express from 'express';
import { ROLES } from '../config/roles.js';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createChallan,
  getAllChallans,
  getChallanById,
  updateChallan,
  deleteChallan,
  getMyChallans,
  updateDeliveryStatus,
} from '../controllers/challanController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticatedUser);

// Routes for all authenticated users
router.route('/my-challans').get(getMyChallans);
router.route('/challan/new').post(createChallan);

// Routes requiring manager or admin role
router
  .route('/challans')
  .get(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getAllChallans);

// Routes for specific challans
router
  .route('/challan/:id')
  .get(getChallanById)
  .put(updateChallan)
  .delete(authorizeRoles(ROLES.ADMIN), deleteChallan);

// Update delivery status
router.route('/challan/:id/status').patch(updateDeliveryStatus);

export default router;
