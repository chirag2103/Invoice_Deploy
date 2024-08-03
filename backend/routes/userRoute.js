import express from 'express';
import {
  deleteUser,
  forgotPassword,
  getSingleUser,
  getUserDetails,
  loginUser,
  logout,
  registerUser,
  resetPassword,
  updatePassword,
  updateProfile,
  updateUserRole,
} from '../controller/userController.js';
import { authorizedRoles, isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logout);
router.route('/user/forgotPassword').post(forgotPassword);
router.route('/user/password/reset/:token').put(resetPassword);
router.route('/user/me').get(isAuthenticatedUser, getUserDetails);
router.route('/user/password/update').put(isAuthenticatedUser, updatePassword);
router.route('/user/me/update').put(isAuthenticatedUser, updateProfile);

router
  .route('/admin/user/:id')
  .get(isAuthenticatedUser, authorizedRoles('admin'), getSingleUser)
  .put(isAuthenticatedUser, authorizedRoles('admin'), updateUserRole)
  .delete(isAuthenticatedUser, authorizedRoles('admin'), deleteUser);

export default router;
