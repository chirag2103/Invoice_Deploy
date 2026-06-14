import express from 'express';
import {
  createProformaInvoice,
  deleteProformaInvoice,
  getProformaInvoices,
  getSingleProformaInvoice,
  updateProformaInvoice,
  getLastProformaInvoice,
} from '../controller/proformaInvoiceController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/proforma/new').post(isAuthenticatedUser, createProformaInvoice);
router.route('/proformas').get(isAuthenticatedUser, getProformaInvoices);
router.route('/proforma/:id').get(isAuthenticatedUser, getSingleProformaInvoice);
router.route('/proforma/:id').put(isAuthenticatedUser, updateProformaInvoice);
router.route('/proforma/:id').delete(isAuthenticatedUser, deleteProformaInvoice);
router.route('/lastproforma').get(isAuthenticatedUser, getLastProformaInvoice);

export default router;
