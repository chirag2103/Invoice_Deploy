import express from 'express';
import { ROLES } from '../config/roles.js';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getMyInvoices,
} from '../controllers/invoiceController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticatedUser);

// Routes for all authenticated users
router.get('/invoices', getMyInvoices);
router.post('/invoice/new', createInvoice);
router.get('/invoice/:id', getInvoiceById);
router.put('/invoice/:id', updateInvoice);

// Routes requiring manager or admin role
router.get(
  '/all-invoices',
  authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
  getAllInvoices
);
router.delete('/invoice/:id', authorizeRoles(ROLES.ADMIN), deleteInvoice);

export default router;
