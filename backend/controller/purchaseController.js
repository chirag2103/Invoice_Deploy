import PurchaseInvoice from '../models/PurchaseInvoice.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createPurchaseInvoice = async (req, res, next) => {
  try {
    const { seller, amount, date, remarks, paid } = req.body;

    if (!seller || !amount || !date) {
      return next(
        new ErrorHandler('Seller, Amount, and Date are required', 400)
      );
    }
    // console.log(seller, amount, date);

    const newPurchase = await PurchaseInvoice.create({
      seller,
      amount,
      date,
      remarks,
      paid: paid || 0,
      status: Number(paid) === Number(amount) ? 'paid' : 'pending',
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

export const addPaymentToPurchase = async (req, res, next) => {
  try {
    const { amountPaid } = req.body;
    const purchaseId = req.params.id;

    if (!amountPaid || isNaN(amountPaid)) {
      return next(new ErrorHandler('Valid paid amount required', 400));
    }

    const purchase = await PurchaseInvoice.findOne({
      _id: purchaseId,
      user: req.user._id,
    });

    if (!purchase) {
      return next(new ErrorHandler('Purchase invoice not found', 404));
    }

    purchase.paid += Number(amountPaid);
    if (purchase.paid >= purchase.amount) {
      purchase.status = 'paid';
    }

    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      purchase,
    });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseSummaryBySeller = async (req, res, next) => {
  try {
    const summary = await PurchaseInvoice.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $group: {
          _id: '$seller',
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paid' },
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
      {
        $sort: { seller: 1 }, // optional: sort alphabetically by seller
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
