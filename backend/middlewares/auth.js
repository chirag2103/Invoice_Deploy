import jwt from 'jsonwebtoken';
import config from '../config/index.js';
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
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorHandler('Please login to access this resource', 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler('Token expired, please login again', 401));
    }
    return next(new ErrorHandler('Invalid token, please login again', 401));
  }

  const user = await User.findById(decodedData.id).select('-password');
  if (!user) {
    return next(new ErrorHandler('User no longer exists, please login again', 401));
  }

  req.user = user;
  next();
});

export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role || 'unknown'} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
