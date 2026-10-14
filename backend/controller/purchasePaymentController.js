import mongoose from 'mongoose';
import PurchasePayment from '../models/PurchasePayment.js';
import Seller from '../models/Seller.js';
import ErrorHandler from '../utils/errorHandler.js';
import paginateQuery from '../utils/paginateQuery.js';

const PURCHASE_PAYMENT_SEARCH_FIELDS = [
  'remarks',
  { field: 'amountPaid', type: 'number' },
  { field: 'date', type: 'date' },
];
const PURCHASE_PAYMENT_ALLOWED_SORT = {
  date: { date: -1 },
  '-date': { date: 1 },
  amount: { amountPaid: -1 },
  '-amount': { amountPaid: 1 },
};

// ✅ Create payment
export const createPayment = async (req, res, next) => {
  try {
    const { seller, amountPaid, date, remarks } = req.body;

    if (!seller || !date || amountPaid === undefined || amountPaid === null) {
      return next(new ErrorHandler('Seller, amount, and date required', 400));
    }
    if (Number(amountPaid) <= 0) {
      return next(new ErrorHandler('Amount must be greater than zero', 400));
    }

    const sellerDoc = await Seller.findOne({
      _id: seller,
      user: req.user._id,
    });
    if (!sellerDoc) {
      return next(new ErrorHandler('Seller not found', 404));
    }

    const payment = await PurchasePayment.create({
      seller,
      amountPaid: Number(amountPaid),
      date,
      remarks: remarks || '',
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Get all payments
export const getPayments = async (req, res, next) => {
  try {
    const { data, pagination } = await paginateQuery(PurchasePayment, {
      filter: { user: req.user._id },
      query: req.query,
      searchFields: PURCHASE_PAYMENT_SEARCH_FIELDS,
      searchRefs: [
        {
          RefModel: Seller,
          refField: 'name',
          localField: 'seller',
          scopeField: 'user',
        },
      ],
      allowedSort: PURCHASE_PAYMENT_ALLOWED_SORT,
      defaultSort: { date: -1 },
      populate: { path: 'seller', select: 'name' },
    });

    res.status(200).json({
      success: true,
      payments: data,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Update payment
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await PurchasePayment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!payment) {
      return next(new ErrorHandler('Payment not found', 404));
    }

    const { seller, amountPaid, date, remarks } = req.body;

    if (seller && String(seller) !== String(payment.seller)) {
      const sellerDoc = await Seller.findOne({
        _id: seller,
        user: req.user._id,
      });
      if (!sellerDoc) {
        return next(new ErrorHandler('Seller not found', 404));
      }
      payment.seller = seller;
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

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      payment,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Delete payment
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await PurchasePayment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!payment) {
      return next(new ErrorHandler('Payment not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Get payments by seller
export const getPaymentsBySeller = async (req, res, next) => {
  try {
    const seller = req.params.sellerId;

    if (!mongoose.Types.ObjectId.isValid(seller)) {
      return next(new ErrorHandler('Invalid seller ID', 400));
    }

    const filter = { user: req.user._id, seller };

    const [{ data, pagination }, totalAgg] = await Promise.all([
      paginateQuery(PurchasePayment, {
        filter,
        query: req.query,
        searchFields: PURCHASE_PAYMENT_SEARCH_FIELDS,
        allowedSort: PURCHASE_PAYMENT_ALLOWED_SORT,
        defaultSort: { date: -1 },
      }),
      PurchasePayment.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            seller: new mongoose.Types.ObjectId(seller),
          },
        },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      payments: data,
      paidAmount: totalAgg[0]?.total || 0,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
