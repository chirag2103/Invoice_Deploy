import express from 'express';
import {
  createChallan,
  getChallans,
  getSingleChallan,
  updateChallan,
  deleteChallan,
  getLastChallan,
} from '../controller/challanController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/challan/new').post(isAuthenticatedUser, createChallan);
router.route('/challans').get(isAuthenticatedUser, getChallans);
router.route('/challan/:id').get(isAuthenticatedUser, getSingleChallan);
router.route('/challan/:id').put(isAuthenticatedUser, updateChallan);
router.route('/challan/:id').delete(isAuthenticatedUser, deleteChallan);
router.route('/lastchallan').get(isAuthenticatedUser, getLastChallan);

export default router;
