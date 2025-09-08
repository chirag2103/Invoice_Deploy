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
    // console.log('Hello' + req.headers.authorization);
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new ErrorHandler('Please login to access this resource', 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  // console.log(decodedData);
  req.user = await User.findById(decodedData.id).select('-password');
  next();
});

export const authorizedRoles = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      // If the user is not authorized, send a 403 Forbidden response
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    // Call the next middleware function
    next();
  };
};
