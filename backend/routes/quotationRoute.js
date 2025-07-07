import express from 'express';
import {
  createQuotation,
  deleteQuotation,
  getQuotations,
  getSingleQuotation,
  updateQuotation,
  getLastQuotation,
} from '../controller/quotationController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/quotation/new').post(isAuthenticatedUser, createQuotation);
router.route('/quotations').get(isAuthenticatedUser, getQuotations);
router.route('/quotation/:id').get(isAuthenticatedUser, getSingleQuotation);
router.route('/quotation/:id').put(isAuthenticatedUser, updateQuotation);
router.route('/quotation/:id').delete(isAuthenticatedUser, deleteQuotation);
router.route('/lastquotation').get(isAuthenticatedUser, getLastQuotation);

export default router;
