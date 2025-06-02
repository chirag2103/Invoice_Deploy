import express from 'express';
import { ROLES } from '../config/roles.js';
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getMyQuotations,
  convertToInvoice,
} from '../controllers/quotationController.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticatedUser);

// Routes for all authenticated users
router.route('/my-quotations').get(getMyQuotations);
router.route('/quotation/new').post(createQuotation);

// Routes requiring manager or admin role
router
  .route('/quotations')
  .get(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getAllQuotations);

// Routes for specific quotations
router
  .route('/quotation/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(authorizeRoles(ROLES.ADMIN), deleteQuotation);

// Convert quotation to invoice
router.route('/quotation/:id/convert-to-invoice').post(convertToInvoice);

export default router;
