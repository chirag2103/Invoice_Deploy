import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import customerRouter from './routes/customerRoute.js';
import invoiceRouter from './routes/invoiceRoute.js';
import paymentRouter from './routes/paymentRoute.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', customerRouter);
app.use('/api', invoiceRouter);
app.use('/api', paymentRouter);

export default app;
