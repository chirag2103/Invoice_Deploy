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
} from '../controllers/userController.js';
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/forgot-password', forgotPassword);
router.put('/auth/reset-password/:token', resetPassword);
router.get('/auth/logout', logout);

// Protected routes (auth required)
router.get('/auth/me', isAuthenticatedUser, getUserDetails);
router.put('/auth/password/update', isAuthenticatedUser, updatePassword);
router.put('/auth/me/update', isAuthenticatedUser, updateProfile);

// Admin routes
router
  .route('/admin/users/:id')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);

export default router;
