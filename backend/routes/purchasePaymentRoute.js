import express from 'express';

import { isAuthenticatedUser } from '../middlewares/auth.js';
import {
  createPayment,
  getPayments,
  getPaymentsBySeller,
  updatePayment,
  deletePayment,
} from '../controller/purchasePaymentController.js';

const router = express.Router();
router.route('/payment/new').post(isAuthenticatedUser, createPayment);
router.route('/payments').get(isAuthenticatedUser, getPayments);
router
  .route('/payment/:id')
  .put(isAuthenticatedUser, updatePayment)
  .delete(isAuthenticatedUser, deletePayment);
router
  .route('/payment/seller/:sellerId')
  .get(isAuthenticatedUser, getPaymentsBySeller);

export default router;
