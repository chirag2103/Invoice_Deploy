import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import healthRouter from './routes/healthRoute.js';
import customerRouter from './routes/customerRoute.js';
import invoiceRouter from './routes/invoiceRoute.js';
import quotationRouter from './routes/quotationRoute.js';
import purchaseOrderRouter from './routes/purchaseOrder.js';
import challanRouter from './routes/challanRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import purchaseInvoiceRouter from './routes/purchaseInvoiceRoute.js';
import purchasePaymentRouter from './routes/purchasePaymentRoute.js';
import proformaInvoiceRouter from './routes/proformaInvoiceRoute.js';
import userRouter from './routes/userRoute.js';
import notFound from './middlewares/notFound.js';
import errorMiddleware from './middlewares/Error.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: config.corsOrigins || true, // allow-list when configured, else reflect origin
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

if (!config.isTest) {
  app.use(morgan(config.isProd ? 'combined' : 'dev'));
}

// Health check — not rate limited.
app.use('/api/health', healthRouter);

// Tight limiter for credential endpoints (brute-force / enumeration defence).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});
app.use(
  ['/api/login', '/api/register', '/api/user/forgotPassword', '/api/user/password/reset'],
  authLimiter
);

// General API limiter.
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
  })
);

app.use('/api', userRouter);
app.use('/api/purchase', purchaseInvoiceRouter);
app.use('/api/purchase', purchasePaymentRouter);
app.use('/api', customerRouter);
app.use('/api', invoiceRouter);
app.use('/api', challanRouter);
app.use('/api', quotationRouter);
app.use('/api', purchaseOrderRouter);
app.use('/api', paymentRouter);
app.use('/api', proformaInvoiceRouter);

app.use(notFound);
app.use(errorMiddleware);

export default app;
