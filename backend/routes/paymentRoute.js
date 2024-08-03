import express from 'express';

import {
  createPayment,
  getPayments,
  getPaymentsByCustomer,
} from '../controller/paymentController.js';

const router = express.Router();
router.route('/payment/new').post(createPayment);
router.route('/payments').get(getPayments);
router.route('/customer/:id/payments').get(getPaymentsByCustomer);

export default router;
