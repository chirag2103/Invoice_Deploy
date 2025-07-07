import express from 'express';
import {
  createCustomer,
  getCustomers,
} from '../controller/customerController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();
router.route('/customer/new').post(isAuthenticatedUser, createCustomer);
router.route('/customers').get(isAuthenticatedUser, getCustomers);

export default router;
