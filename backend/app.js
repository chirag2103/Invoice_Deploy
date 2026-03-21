import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import customerRouter from './routes/customerRoute.js';
import invoiceRouter from './routes/invoiceRoute.js';
import quotationRouter from './routes/quotationRoute.js';
import purchaseOrderRouter from './routes/purchaseOrder.js';
import challanRouter from './routes/challanRoute.js';
import paymentRouter from './routes/paymentRoute.js';
// import purchaseRouter from './routes/purchaseRoute.js';
import purchaseInvoiceRouter from './routes/purchaseInvoiceRoute.js';
import purchasePaymentRouter from './routes/purchasePaymentRoute.js';
import userRouter from './routes/userRoute.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/Error.js';

const app = express();

app.use(
  cors({
    origin: '*', // or your frontend domain
  }),
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', userRouter);
app.use('/api/purchase', purchaseInvoiceRouter);
app.use('/api/purchase', purchasePaymentRouter);
app.use('/api', customerRouter);
app.use('/api', invoiceRouter);
app.use('/api', challanRouter);
app.use('/api', quotationRouter);
app.use('/api', purchaseOrderRouter);
app.use('/api', paymentRouter);
// app.use('/api', purchaseRouter);

// Add this to app.js, AFTER all your routes

app.use(errorMiddleware);

export default app;
