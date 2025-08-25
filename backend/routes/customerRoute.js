import express from 'express';
import {
  createCustomer,
  getCustomers,
} from '../controller/customerController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';
import { createSeller, getSellers } from '../controller/sellerController.js';

const router = express.Router();
router.route('/customer/new').post(isAuthenticatedUser, createCustomer);
router.route('/customers').get(isAuthenticatedUser, getCustomers);
router.route('/seller/new').post(isAuthenticatedUser, createSeller);
router.route('/sellers').get(isAuthenticatedUser, getSellers);

export default router;
