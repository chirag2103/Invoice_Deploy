import jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncError from './catchAsyncError.js';
import User from '../models/userModel.js';

export const isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHandler('Please login to access this resource', 401));
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id).select('-password');
    next();
  } catch (error) {
    // Handle JWT expiration specifically
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler('Token expired, please login again', 401));
    }

    // Handle other JWT errors
    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorHandler('Invalid token, please login again', 401));
    }

    // For any other errors
    return next(new ErrorHandler('Authentication failed', 401));
  }
});

export const authorizedRoles = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
