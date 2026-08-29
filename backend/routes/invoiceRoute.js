import express from 'express';
import {
  createInvoice,
  deleteInvoice,
  getCustomerBillingInfo,
  getInvoices,
  getInvoicesByCustomer,
  getLastInvoice,
  getSingleInvoice,
  getStatementByCustomer,
  updateInvoice,
} from '../controller/InvoiceController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';
import {
  getFinancialYearAnalytics,
  getFinancialYears,
} from '../controller/analyticsController.js';

const router = express.Router();
router.route('/invoice/new').post(isAuthenticatedUser, createInvoice);
router.route('/invoices').get(isAuthenticatedUser, getInvoices);
router
  .route('/customer/:id/invoices')
  .get(isAuthenticatedUser, getInvoicesByCustomer);
router.route('/invoice/:id').get(isAuthenticatedUser, getSingleInvoice);
router.route('/invoice/:id').put(isAuthenticatedUser, updateInvoice);
router.route('/invoice/:id').delete(isAuthenticatedUser, deleteInvoice);
router.route('/lastinvoice').get(isAuthenticatedUser, getLastInvoice);
router.route('/billingInfo').get(isAuthenticatedUser, getCustomerBillingInfo);
router.route('/statement/:id').get(isAuthenticatedUser, getStatementByCustomer);
router.get('/financial-years', isAuthenticatedUser, getFinancialYears);
router.get('/financial-year', isAuthenticatedUser, getFinancialYearAnalytics);

export default router;
