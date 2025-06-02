import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

router.route('/stats').get(isAuthenticatedUser, getDashboardStats);

export default router;
