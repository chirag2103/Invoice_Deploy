import mongoose from 'mongoose';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';

export const createPayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.create({ ...req.body, user: req.user.id });
  res.status(201).json({
    payment,
    message: 'Payment added successfully',
  });
});

export const getPayments = catchAsyncError(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate('customer')
    .sort({ date: -1 })
    .lean();

  const { results, pagination } = filterAndPaginate(payments, req.query, [
    'customer.name',
    'remarks',
    'amountPaid',
    'date',
  ]);

  res.status(200).json({
    payments: results,
    pagination,
  });
});

export const getPaymentsByCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(new ErrorHandler('Invalid customer ID', 400));
    }

    const payments = await Payment.find({
      user: req.user.id,
      customer: customerId,
    })
      .sort({ date: -1 })
      .lean();

    const customer = await Customer.findOne({
      _id: customerId,
      user: req.user.id,
    });

    const { results, pagination } = filterAndPaginate(payments, req.query, [
      'remarks',
      'amountPaid',
      'date',
    ]);

    const total = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

    res.status(200).json({
      payments: results,
      paidAmount: total,
      customerName: customer?.name || '',
      pagination,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoices for the customer', 500));
  }
});

export const updatePayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { ...req.body, user: req.user.id },
    { new: true, runValidators: true },
  ).populate('customer');

  if (!payment) {
    return next(new ErrorHandler('Payment not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Payment updated successfully',
    payment,
  });
});

export const deletePayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!payment) {
    return next(new ErrorHandler('Payment not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Payment deleted successfully',
  });
});
