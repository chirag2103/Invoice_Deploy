import express from 'express';
import {
  createInvoice,
  deleteInvoice,
  getCustomerBillingInfo,
  getInvoices,
  getInvoicesByCustomer,
  getLastInvoice,
  getSingleInvoice,
  updateInvoice,
} from '../controller/InvoiceController.js';

const router = express.Router();
router.route('/invoice/new').post(createInvoice);
router.route('/invoices').get(getInvoices);
router.route('/customer/:id/invoices').get(getInvoicesByCustomer);
router.route('/invoice/:id').get(getSingleInvoice);
router.route('/invoice/:id').put(updateInvoice);
router.route('/invoice/:id').delete(deleteInvoice);
router.route('/lastinvoice').get(getLastInvoice);
router.route('/customer/invoice').get(getInvoicesByCustomer);
router.route('/billingInfo').get(getCustomerBillingInfo);

export default router;
