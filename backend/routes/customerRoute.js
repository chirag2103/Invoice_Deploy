import express from 'express';
import {
  createCustomer,
  getCustomers,
} from '../controller/customerController.js';

const router = express.Router();
router.route('/customer/new').post(createCustomer);
router.route('/customers').get(getCustomers);

export default router;
