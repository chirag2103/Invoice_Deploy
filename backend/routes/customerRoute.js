import express from 'express';
import { ROLES } from '../config/roles.js';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createCustomer,
  getCustomers,
} from '../controllers/customerController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticatedUser);

// Routes for managers and admin
router
  .route('/customer/new')
  .post(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), createCustomer);

router.route('/customers').get(getCustomers);

export default router;
