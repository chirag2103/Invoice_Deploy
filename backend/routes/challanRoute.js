import express from 'express';
import {
  createChallan,
  getChallans,
  getSingleChallan,
  updateChallan,
  deleteChallan,
  getLastChallan,
} from '../controller/challanController.js';

const router = express.Router();

router.route('/challan/new').post(createChallan);
router.route('/challans').get(getChallans);
router.route('/challan/:id').get(getSingleChallan);
router.route('/challan/:id').put(updateChallan);
router.route('/challan/:id').delete(deleteChallan);
router.route('/lastchallan').get(getLastChallan);

export default router;
