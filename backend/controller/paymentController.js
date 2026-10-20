import mongoose from 'mongoose';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import ErrorHandler from '../utils/errorHandler.js';
import paginateQuery from '../utils/paginateQuery.js';

const PAYMENT_SEARCH_FIELDS = [
  'remarks',
  { field: 'amountPaid', type: 'number' },
  { field: 'date', type: 'date' },
];
const PAYMENT_ALLOWED_SORT = {
  date: { date: -1 },
  '-date': { date: 1 },
  amount: { amountPaid: -1 },
  '-amount': { amountPaid: 1 },
};

export const createPayment = catchAsyncError(async (req, res, next) => {
  const { customer, amountPaid, date, remarks } = req.body;

  if (!customer || !date || amountPaid === undefined || amountPaid === null) {
    return next(
      new ErrorHandler('Customer, amount and date are required', 400)
    );
  }
  if (Number(amountPaid) <= 0) {
    return next(new ErrorHandler('Amount must be greater than zero', 400));
  }

  const customerDoc = await Customer.findOne({
    _id: customer,
    user: req.user.id,
    isArchived: { $ne: true },
  });
  if (!customerDoc) {
    return next(new ErrorHandler('Customer not found', 404));
  }

  const payment = await Payment.create({
    user: req.user.id,
    customer,
    amountPaid: Number(amountPaid),
    date,
    remarks: remarks || '',
  });

  res.status(201).json({
    payment,
    message: 'Payment added successfully',
  });
});

export const getPayments = catchAsyncError(async (req, res, next) => {
  const { data, pagination } = await paginateQuery(Payment, {
    filter: { user: req.user.id },
    query: req.query,
    searchFields: PAYMENT_SEARCH_FIELDS,
    searchRefs: [
      {
        RefModel: Customer,
        refField: 'name',
        localField: 'customer',
        scopeField: 'user',
      },
    ],
    allowedSort: PAYMENT_ALLOWED_SORT,
    defaultSort: { date: -1 },
    populate: 'customer',
  });

  res.status(200).json({
    payments: data,
    pagination,
  });
});

export const getPaymentsByCustomer = catchAsyncError(async (req, res, next) => {
  const customerId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return next(new ErrorHandler('Invalid customer ID', 400));
  }

  const customer = await Customer.findOne({
    _id: customerId,
    user: req.user.id,
  }).lean();

  if (!customer) {
    return next(new ErrorHandler('Customer not found', 404));
  }

  const filter = { user: req.user.id, customer: customerId };

  const [{ data, pagination }, totalAgg] = await Promise.all([
    paginateQuery(Payment, {
      filter,
      query: req.query,
      searchFields: PAYMENT_SEARCH_FIELDS,
      allowedSort: PAYMENT_ALLOWED_SORT,
      defaultSort: { date: -1 },
    }),
    Payment.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          customer: new mongoose.Types.ObjectId(customerId),
        },
      },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
  ]);

  res.status(200).json({
    payments: data,
    paidAmount: totalAgg[0]?.total || 0,
    customerName: customer.name || '',
    pagination,
  });
});

export const updatePayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!payment) {
    return next(new ErrorHandler('Payment not found', 404));
  }

  const { customer, amountPaid, date, remarks } = req.body;

  if (customer && String(customer) !== String(payment.customer)) {
    const customerDoc = await Customer.findOne({
      _id: customer,
      user: req.user.id,
      isArchived: { $ne: true },
    });
    if (!customerDoc) {
      return next(new ErrorHandler('Customer not found', 404));
    }
    payment.customer = customer;
  }

  if (amountPaid !== undefined) {
    if (Number(amountPaid) <= 0) {
      return next(new ErrorHandler('Amount must be greater than zero', 400));
    }
    payment.amountPaid = Number(amountPaid);
  }
  if (date !== undefined) payment.date = date;
  if (remarks !== undefined) payment.remarks = remarks;

  await payment.save();
  await payment.populate('customer');

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
