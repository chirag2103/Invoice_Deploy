import PurchaseInvoice from '../models/PurchaseInvoice.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createPurchaseInvoice = async (req, res, next) => {
  try {
    const { seller, amount, date, remarks } = req.body;

    if (!seller || !amount || !date) {
      return next(
        new ErrorHandler('Seller, Amount, and Date are required', 400)
      );
    }

    const newPurchase = await PurchaseInvoice.create({
      seller,
      amount,
      date,
      remarks,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Purchase invoice created successfully',
      purchase: newPurchase,
    });
  } catch (err) {
    next(err);
  }
};

// Optional: Get all purchase invoices for logged-in user
export const getAllPurchases = async (req, res, next) => {
  try {
    const purchases = await PurchaseInvoice.find({ user: req.user._id }).sort({
      date: -1,
    });

    res.status(200).json({
      success: true,
      purchases,
    });
  } catch (err) {
    next(err);
  }
};
