class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    // Errors we construct deliberately are safe to show to the client verbatim.
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default ErrorHandler;
