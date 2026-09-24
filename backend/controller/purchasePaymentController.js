import PurchasePayment from '../models/PurchasePayment.js';
import Seller from '../models/Seller.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';

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
    const allPayments = await PurchasePayment.find({ user: req.user._id })
      .populate('seller', 'name')
      .sort({ date: -1 });
    const { results, pagination } = filterAndPaginate(allPayments, req.query, [
      'seller.name',
      'amountPaid',
      'date',
      'remarks',
    ]);

    res.status(200).json({
      success: true,
      payments: results,
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

    const allPayments = await PurchasePayment.find({
      user: req.user._id,
      seller,
    }).sort({ date: -1 });

    const total = allPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const { results, pagination } = filterAndPaginate(allPayments, req.query, [
      'amountPaid',
      'date',
      'remarks',
    ]);

    res.status(200).json({
      success: true,
      payments: results,
      paidAmount: total,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
