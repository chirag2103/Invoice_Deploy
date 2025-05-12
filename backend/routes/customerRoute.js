import express from 'express';
import {
  createCustomer,
  getCustomers,
  getSingleCustomer,
} from '../controller/customerController.js';

const router = express.Router();
router.route('/customer/new').post(createCustomer);
router.route('/customers').get(getCustomers);
router.route('/customer/:id').get(getSingleCustomer);

export default router;
