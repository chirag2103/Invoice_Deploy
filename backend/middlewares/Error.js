import ErrorHandler from '../utils/errorHandler.js';

const Error = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong Mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ${err.path}: ${err.value}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongodb duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value '${value}' for field '${field}'. Please use a different value.`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please log in again.';
    err = new ErrorHandler(message, 401);
  }

  // JWT Expire error
  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired. Please log in again.';
    err = new ErrorHandler(message, 401);
  }

  // Send response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default Error;
