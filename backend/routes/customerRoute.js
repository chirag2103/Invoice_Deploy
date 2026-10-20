import express from 'express';
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
} from '../controller/customerController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';
import {
  createSeller,
  getSellers,
  updateSeller,
  deleteSeller,
  restoreSeller,
} from '../controller/sellerController.js';

const router = express.Router();
router.route('/customer/new').post(isAuthenticatedUser, createCustomer);
router.route('/customers').get(isAuthenticatedUser, getCustomers);
router
  .route('/customer/:id')
  .put(isAuthenticatedUser, updateCustomer)
  .delete(isAuthenticatedUser, deleteCustomer);
router.route('/seller/new').post(isAuthenticatedUser, createSeller);
router.route('/sellers').get(isAuthenticatedUser, getSellers);
router
  .route('/seller/:id')
  .put(isAuthenticatedUser, updateSeller)
  .delete(isAuthenticatedUser, deleteSeller);

router.put('/customer/:id/restore', isAuthenticatedUser, restoreCustomer);
router.put('/seller/:id/restore', isAuthenticatedUser, restoreSeller);

export default router;
