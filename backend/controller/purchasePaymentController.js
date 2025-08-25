import PurchasePayment from '../models/PurchasePayment.js';
import PurchaseInvoice from '../models/PurchaseInvoice.js';
import ErrorHandler from '../utils/errorHandler.js';

// ✅ Create payment
export const createPayment = async (req, res, next) => {
  try {
    const { seller, amountPaid, date, remarks } = req.body;

    if (!seller || !amountPaid || !date) {
      return next(new ErrorHandler('Seller, amount, and date required', 400));
    }

    const payment = await PurchasePayment.create({
      seller,
      amountPaid,
      date,
      remarks,
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
    const payments = await PurchasePayment.find({ user: req.user._id })
      .populate('seller', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Update payment
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await PurchasePayment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!payment) {
      return next(new ErrorHandler('Payment not found', 404));
    }

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

    const payments = await PurchasePayment.find({
      user: req.user._id,
      seller,
    }).sort({ date: -1 });

    const total = payments.reduce((acc, p) => acc + p.amountPaid, 0);

    res.status(200).json({
      success: true,
      payments,
      paidAmount: total,
    });
  } catch (err) {
    next(err);
  }
};
