import PurchaseInvoice from '../models/PurchaseInvoice.js';
import PurchasePayment from '../models/PurchasePayment.js';
import Seller from '../models/Seller.js';

import ErrorHandler from '../utils/errorHandler.js';

// ✅ Create purchase invoice
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

// ✅ Get all purchase invoices for logged-in user
export const getAllPurchases = async (req, res, next) => {
  try {
    const purchases = await PurchaseInvoice.find({ user: req.user._id })
      .populate('seller', 'name') // show seller name
      .sort({ date: -1 });
    console.log(purchases);

    res.status(200).json({
      success: true,
      purchases,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Update purchase invoice
export const updatePurchaseInvoice = async (req, res, next) => {
  try {
    const purchase = await PurchaseInvoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!purchase) {
      return next(new ErrorHandler('Purchase invoice not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Purchase invoice updated',
      purchase,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Delete purchase invoice + its payments
export const deletePurchaseInvoice = async (req, res, next) => {
  try {
    const purchase = await PurchaseInvoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!purchase) {
      return next(new ErrorHandler('Purchase invoice not found', 404));
    }

    // also delete linked payments
    await PurchasePayment.deleteMany({
      seller: purchase.seller,
      user: req.user._id,
      // optionally match invoice id if you add invoice reference
    });

    res.status(200).json({
      success: true,
      message: 'Purchase invoice & related payments deleted',
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Seller-wise summary (total amount, total paid, remaining)
export const getPurchaseSummaryBySeller = async (req, res, next) => {
  try {
    const summary = await PurchaseInvoice.aggregate([
      {
        $match: { user: req.user._id },
      },
      {
        $lookup: {
          from: 'purchasepayments',
          localField: 'seller',
          foreignField: 'seller',
          as: 'payments',
        },
      },
      {
        $group: {
          _id: '$seller',
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: { $sum: '$payments.amountPaid' } },
        },
      },
      {
        $project: {
          seller: '$_id',
          totalAmount: 1,
          totalPaid: 1,
          remaining: { $subtract: ['$totalAmount', '$totalPaid'] },
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Seller statement (invoices + payments chronologically)
export const getSellerStatement = async (req, res, next) => {
  try {
    const sellerId = req.params.seller;

    const invoices = await PurchaseInvoice.find({
      user: req.user._id,
      seller: sellerId,
    }).sort({ date: 1 });

    const payments = await PurchasePayment.find({
      user: req.user._id,
      seller: sellerId,
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      invoices,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllSellerSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // optional filters
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Step 1: Aggregate total bills per seller
    const invoices = await PurchaseInvoice.aggregate([
      {
        $match: {
          user: userId,
          ...(startDate && endDate ? { date: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: '$seller',
          totalBills: { $sum: '$amount' },
        },
      },
    ]);

    // Step 2: Aggregate total payments per seller
    const payments = await PurchasePayment.aggregate([
      {
        $match: {
          user: userId,
          ...(startDate && endDate ? { date: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: '$seller',
          totalPaid: { $sum: '$amountPaid' },
        },
      },
    ]);

    // Step 3: Map payments for easy lookup
    const paymentMap = {};
    payments.forEach((p) => {
      paymentMap[p._id.toString()] = p.totalPaid;
    });

    // Step 4: Merge + fetch seller details
    const summary = await Promise.all(
      invoices.map(async (inv) => {
        const seller = await Seller.findById(inv._id).select('name'); // populate name only
        const sellerName = seller ? seller.name : 'Unknown Seller';

        const sellerId = inv._id.toString();
        const totalPaid = paymentMap[sellerId] || 0;

        return {
          seller: {
            _id: inv._id,
            name: sellerName,
          },
          totalBills: inv.totalBills,
          totalPaid,
          remaining: inv.totalBills - totalPaid,
        };
      })
    );

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};
