import express from 'express';
import {
  getFinancialYears,
  getFinancialYearSummary,
} from '../controller/analyticsController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.get('/financial-years', isAuthenticatedUser, getFinancialYears);
router.get('/summary', isAuthenticatedUser, getFinancialYearSummary);

export default router;
