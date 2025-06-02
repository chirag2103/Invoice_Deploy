import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import ErrorHandler from '../utils/errorHandler.js';

export const isAuthenticatedUser = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log(
        'Token from Authorization header:',
        token ? 'Present' : 'Missing'
      );
    }
    // Fallback to cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
      console.log('Token from cookies:', token ? 'Present' : 'Missing');
    }

    if (!token) {
      console.log('No token found in request');
      return next(
        new ErrorHandler('Please login to access this resource', 401)
      );
    }

    try {
      console.log(
        'Verifying token with secret:',
        process.env.JWT_SECRET ? 'Present' : 'Missing'
      );
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully, user ID:', decodedData.id);

      const user = await User.findById(decodedData.id);
      if (!user) {
        console.log('No user found with ID:', decodedData.id);
        return next(new ErrorHandler('User not found', 401));
      }

      if (
        user.passwordChangedAt &&
        decodedData.iat < user.passwordChangedAt.getTime() / 1000
      ) {
        console.log('Password was changed after token was issued');
        return next(
          new ErrorHandler(
            'User recently changed password. Please login again',
            401
          )
        );
      }

      console.log('Authentication successful for user:', user.email);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT Error:', jwtError.message);
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return next(new ErrorHandler('Invalid token. Please login again', 401));
      }
      if (jwtError instanceof jwt.TokenExpiredError) {
        return next(new ErrorHandler('Token expired. Please login again', 401));
      }
      return next(new ErrorHandler('Authentication failed', 401));
    }
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return next(new ErrorHandler('Authentication failed', 401));
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ErrorHandler('Please login to access this resource', 401)
      );
    }

    if (!roles.includes(req.user.role)) {
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

export const isResourceOwner = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(
        new ErrorHandler('Please login to access this resource', 401)
      );
    }

    const resourceUserId = getResourceUserId(req);

    if (!resourceUserId) {
      return next(new ErrorHandler('Resource not found', 404));
    }

    // Convert both IDs to strings for comparison
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return next(
      new ErrorHandler(
        'You do not have permission to access this resource',
        403
      )
    );
  };
};

export const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(
        new ErrorHandler('Please login to access this resource', 401)
      );
    }

    // Allow if user is admin
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = getResourceUserId(req);

    if (!resourceUserId) {
      return next(new ErrorHandler('Resource not found', 404));
    }

    // Allow if user is accessing their own resource
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return next(
      new ErrorHandler(
        'You do not have permission to access this resource',
        403
      )
    );
  };
};
