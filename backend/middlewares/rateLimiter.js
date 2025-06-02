import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes rate limiter (login, register, forgot password)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: {
    status: 'error',
    message:
      'Too many login attempts from this IP, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PDF generation rate limiter
export const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 PDF generations per 5 minutes
  message: {
    status: 'error',
    message:
      'Too many PDF generation requests from this IP, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Export routes rate limiter
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 export requests per hour
  message: {
    status: 'error',
    message:
      'Too many export requests from this IP, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
