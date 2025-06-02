import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.js';
import customerRouter from './routes/customerRoute.js';
import invoiceRouter from './routes/invoiceRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import userRouter from './routes/userRoute.js';
import quotationRouter from './routes/quotationRoute.js';
import challanRouter from './routes/challanRoute.js';
import dashboardRouter from './routes/dashboardRoutes.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/Error.js';

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount auth routes first (no rate limiting for now during testing)
app.use('/api/v1', userRouter);

// Apply rate limiters to protected routes
app.use('/api/v1/customer', apiLimiter, customerRouter);
app.use('/api/v1', apiLimiter, invoiceRouter);
app.use('/api/v1/payment', apiLimiter, paymentRouter);
app.use('/api/v1/quotation', apiLimiter, quotationRouter);
app.use('/api/v1/challan', apiLimiter, challanRouter);
app.use('/api/v1/dashboard', apiLimiter, dashboardRouter);

// Error handling middleware
app.use(errorMiddleware);

export default app;
