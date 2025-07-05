import express from 'express';
import {
  createQuotation,
  deleteQuotation,
  getQuotations,
  getSingleQuotation,
  updateQuotation,
  getLastQuotation,
} from '../controller/quotationController.js';

const router = express.Router();

router.route('/quotation/new').post(createQuotation);
router.route('/quotations').get(getQuotations);
router.route('/quotation/:id').get(getSingleQuotation);
router.route('/quotation/:id').put(updateQuotation);
router.route('/quotation/:id').delete(deleteQuotation);
router.route('/lastquotation').get(getLastQuotation);

export default router;
