import config from '../config/index.js';
import ErrorHandler from '../utils/errorHandler.js';

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ErrorHandler)) {
    // Normalise well-known non-operational errors.
    if (err.name === 'CastError') {
      error = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {}).join(', ') || 'field';
      error = new ErrorHandler(`Duplicate value for ${field}`, 400);
    } else if (err.name === 'ValidationError') {
      const message = Object.values(err.errors || {})
        .map((e) => e.message)
        .join('; ');
      error = new ErrorHandler(message || 'Validation failed', 400);
    } else if (err.name === 'JsonWebTokenError') {
      error = new ErrorHandler('Invalid token, please login again', 401);
    } else if (err.name === 'TokenExpiredError') {
      error = new ErrorHandler('Token expired, please login again', 401);
    }
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error instanceof ErrorHandler && error.isOperational;

  // Log server-side failures (never leak stacks to the client).
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(
      `[error] ${req.method} ${req.originalUrl} ->`,
      err.stack || err
    );
  }

  const message =
    isOperational || !config.isProd
      ? error.message || 'Internal Server Error'
      : 'Something went wrong';

  res.status(statusCode).json({ success: false, message });
};

export default errorMiddleware;
