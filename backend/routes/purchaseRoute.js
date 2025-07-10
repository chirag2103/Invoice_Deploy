import express from 'express';
import {
  createPurchaseInvoice,
  getAllPurchases,
} from '../controller/purchaseController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

// Create a new purchase invoice
router.post('/purchase/new', isAuthenticatedUser, createPurchaseInvoice);

// Get all purchases (optional)
router.get('/purchase/all', isAuthenticatedUser, getAllPurchases);

export default router;
