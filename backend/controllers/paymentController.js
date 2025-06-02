import catchAsyncError from '../middlewares/catchAsyncError.js';
import Payment from '../models/Payment.js';
import ErrorHandler from '../utils/errorHandler.js';

// Create a new payment
export const createPayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    payment,
  });
});

// Get all payments
export const getPayments = catchAsyncError(async (req, res, next) => {
  const payments = await Payment.find()
    .populate('customer', 'name email phone')
    .populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    payments,
  });
});

// Get payments by customer ID
export const getPaymentsByCustomer = catchAsyncError(async (req, res, next) => {
  const customerId = req.params.id;

  const payments = await Payment.find({ customer: customerId })
    .populate('customer', 'name email phone')
    .populate('createdBy', 'name email')
    .sort({ paymentDate: -1 });

  res.status(200).json({
    success: true,
    payments,
  });
});
