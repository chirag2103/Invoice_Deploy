import mongoose from 'mongoose';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createPayment = async (req, res, next) => {
  const payment = await Payment.create(req.body);
  res.status(201).json({
    payment,
  });
};
export const getPayments = async (req, res, next) => {
  const payments = await Payment.find().populate('customer');
  // console.log(customers);
  res.status(200).json({
    payments,
  });
};
export const getPaymentsByCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customerId = req.params.id;
    console.log(customerId);

    // Validate if customerId is a valid ObjectId before querying the database
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(new ErrorHandler('Invalid customer ID', 400));
    }

    const payments = await Payment.find({ customer: customerId });
    // const invoices = await Invoice.find({ customer: customerId }).populate(
    //   'customer',
    //   'name'
    // );
    const customer = await Customer.findById(customerId);
    const customerName = customer.name;
    console.log(customerName);
    let total = 0;
    payments.map((payment) => {
      total += payment.amountPaid;
    });
    console.log(total);

    res.status(200).json({
      payments,
      paidAmount: total,
      customerName,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler('Error fetching invoices for the customer', 500));
  }
});
