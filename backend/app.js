import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import customerRouter from './routes/customerRoute.js';
import invoiceRouter from './routes/invoiceRoute.js';
import quotationRouter from './routes/quotationRoute.js';
import challanRouter from './routes/challanRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import userRouter from './routes/userRoute.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: '*', // or your frontend domain
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', customerRouter);
app.use('/api', invoiceRouter);
app.use('/api', challanRouter);
app.use('/api', quotationRouter);
app.use('/api', paymentRouter);
app.use('/api', userRouter);

export default app;
