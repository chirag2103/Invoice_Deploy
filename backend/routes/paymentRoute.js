import express from 'express';
import { ROLES } from '../config/roles.js';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createPayment,
  getPayments,
  getPaymentsByCustomer,
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticatedUser);

// Routes for managers and admin
router
  .route('/payment/new')
  .post(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), createPayment);

router
  .route('/payments')
  .get(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getPayments);

router
  .route('/customer/:id/payments')
  .get(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getPaymentsByCustomer);

export default router;
