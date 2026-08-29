import express from 'express';
import {
  createPurchaseInvoice,
  deletePurchaseInvoice,
  getAllPurchases,
  getAllSellerSummary,
  getPurchaseSummaryBySeller,
  getSellerStatement,
  updatePurchaseInvoice,
} from '../controller/purchaseInvoiceController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

// Create a new purchase invoice
router.post('/new', isAuthenticatedUser, createPurchaseInvoice);

// Update / delete a single purchase invoice
router.put('/:id', isAuthenticatedUser, updatePurchaseInvoice);
router.delete('/:id', isAuthenticatedUser, deletePurchaseInvoice);

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
