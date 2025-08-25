import express from 'express';
import {
  createPurchaseInvoice,
  getAllPurchases,
  getAllSellerSummary,
  getPurchaseSummaryBySeller,
  getSellerStatement,
} from '../controller/purchaseInvoiceController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

// Create a new purchase invoice
router.post('/new', isAuthenticatedUser, createPurchaseInvoice);

// Seller-wise summaries
router.get('/summary/all', isAuthenticatedUser, getAllSellerSummary);
router.get(
  '/summary/:sellerId',
  isAuthenticatedUser,
  getPurchaseSummaryBySeller
);
router.get('/statement/:sellerId', isAuthenticatedUser, getSellerStatement);

// Get all purchases
router.get('/get/all', isAuthenticatedUser, getAllPurchases);

export default router;
