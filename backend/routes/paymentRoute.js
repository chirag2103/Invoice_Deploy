import express from 'express';

import {
  createPayment,
  getPayments,
  getPaymentsByCustomer,
  updatePayment,
  deletePayment,
} from '../controller/paymentController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();
router.route('/payment/new').post(isAuthenticatedUser, createPayment);
router.route('/payments').get(isAuthenticatedUser, getPayments);
router
  .route('/payment/:id')
  .put(isAuthenticatedUser, updatePayment)
  .delete(isAuthenticatedUser, deletePayment);
router
  .route('/customer/:id/payments')
  .get(isAuthenticatedUser, getPaymentsByCustomer);

export default router;
