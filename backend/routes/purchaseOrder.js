import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth.js';
import {
  createPO,
  deletePO,
  getLastPO,
  getPO,
  getSinglePO,
  updatePO,
} from '../controller/purchaseOrderController.js';

const router = express.Router();

router.route('/po/new').post(isAuthenticatedUser, createPO);
router.route('/pos').get(isAuthenticatedUser, getPO);
router.route('/po/:id').get(isAuthenticatedUser, getSinglePO);
router.route('/po/:id').put(isAuthenticatedUser, updatePO);
router.route('/po/:id').delete(isAuthenticatedUser, deletePO);
router.route('/lastpo').get(isAuthenticatedUser, getLastPO);

export default router;
