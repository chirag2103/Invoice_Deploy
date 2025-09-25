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
    // console.log(purchases);

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
      // 1) Invoices for this user
      { $match: { user: req.user._id } },

      // 2) Group invoices by seller -> totalAmount
      {
        $group: {
          _id: '$seller',
          totalAmount: { $sum: '$amount' },
        },
      },

      // 3) Lookup payments for this user & seller (once per seller)
      {
        $lookup: {
          from: 'purchasepayments',
          let: { sellerId: '$_id', userId: req.user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$seller', '$$sellerId'] },
                    { $eq: ['$user', '$$userId'] },
                  ],
                },
              },
            },
            { $project: { amountPaid: 1 } },
          ],
          as: 'payments',
        },
      },

      // 4) Sum payments array (no double counting)
      {
        $addFields: {
          totalPaid: { $ifNull: [{ $sum: '$payments.amountPaid' }, 0] },
        },
      },

      // 5) Join seller name
      {
        $lookup: {
          from: 'sellers',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      {
        $unwind: {
          path: '$sellerInfo',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 6) Shape + remaining + sort by seller name
      {
        $project: {
          seller: '$_id',
          sellerName: { $ifNull: ['$sellerInfo.name', 'Unknown Seller'] },
          totalAmount: 1,
          totalPaid: 1,
          remaining: { $subtract: ['$totalAmount', '$totalPaid'] },
          _id: 0,
        },
      },
      { $sort: { sellerName: 1 } },
    ]);

    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

// ✅ Seller statement (invoices + payments chronologically)
// export const getSellerStatement = async (req, res, next) => {
//   try {
//     const sellerId = req.params.sellerId;

//     const invoices = await PurchaseInvoice.find({
//       user: req.user._id,
//       seller: sellerId,
//     }).sort({ date: 1 });

//     const payments = await PurchasePayment.find({
//       user: req.user._id,
//       seller: sellerId,
//     })
//       .populate('seller', 'name')
//       .sort({ date: 1 });

//     res.status(200).json({
//       success: true,
//       invoices,
//       payments,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getSellerStatement = async (req, res) => {
//   try {
//     const { sellerId } = req.params;
//     const userId = req.user.id;

//     const seller = await Seller.findOne({ _id: sellerId, user: userId });
//     if (!seller) {
//       return res.status(404).json({ error: 'Seller not found' });
//     }

//     // fetch purchases
//     const purchases = await PurchaseInvoice.find({
//       seller: sellerId,
//       user: userId,
//     }).sort({ date: 1 });

//     // fetch payments
//     const payments = await PurchasePayment.find({
//       seller: sellerId,
//       user: userId,
//     }).sort({ date: 1 });

//     let statement = [];
//     let balance = 0;
//     let totalPurchase = 0;
//     let totalPaid = 0;

//     purchases.forEach((p) => {
//       balance += p.amount;
//       totalPurchase += p.amount;
//       statement.push({
//         date: p.date,
//         type: 'purchase',
//         invoiceAmount: p.amount,
//         paymentAmount: null,
//         balance,
//       });
//     });

//     payments.forEach((pay) => {
//       balance -= pay.amount;
//       totalPaid += pay.amount;
//       statement.push({
//         date: pay.date,
//         type: 'payment',
//         invoiceAmount: null,
//         paymentAmount: pay.amount,
//         balance,
//       });
//     });

//     // sort final statement by date
//     statement.sort((a, b) => new Date(a.date) - new Date(b.date));

//     res.json({
//       sellerName: seller.name,
//       gstNo: seller.gstNo || '',
//       statement,
//       totalPurchase,
//       totalPaid,
//       balance,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// export const getSellerStatement = async (req, res, next) => {
//   try {
//     const { sellerId } = req.params;

//     // get purchases
//     const purchases = await PurchaseInvoice.find({
//       seller: sellerId,
//       user: req.user._id,
//     })
//       .select('date amount remarks')
//       .lean();

//     // get payments
//     const payments = await PurchasePayment.find({
//       seller: sellerId,
//       user: req.user._id,
//     })
//       .select('date amountPaid remarks')
//       .lean();

//     // merge both
//     let combined = [];

//     purchases.forEach((p) => {
//       combined.push({
//         date: p.date,
//         type: 'purchase',
//         amount: p.amount,
//         remarks: p.remarks,
//       });
//     });

//     payments.forEach((p) => {
//       combined.push({
//         date: p.date,
//         type: 'payment',
//         amount: p.amountPaid,
//         remarks: p.remarks,
//       });
//     });

//     // sort by date
//     combined.sort((a, b) => new Date(a.date) - new Date(b.date));

//     // calculate running balance
//     let balance = 0;
//     combined = combined.map((entry) => {
//       if (entry.type === 'purchase') {
//         balance += entry.amount;
//       } else if (entry.type === 'payment') {
//         balance -= entry.amount;
//       }
//       return { ...entry, balance };
//     });

//     res.status(200).json({
//       success: true,
//       statement: combined,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// Example backend code (Node.js / Express)
export const getSellerStatement = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // ✅ Fetch seller
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // ✅ Fetch purchases & payments sorted
    const purchases = await PurchaseInvoice.find({ seller: sellerId }).sort({
      date: 1,
    });
    const payments = await PurchasePayment.find({ seller: sellerId }).sort({
      date: 1,
    });

    const statement = [];
    let totalPurchase = 0;
    let totalPaid = 0;
    let currentBalance = 0;

    // ✅ Opening Balance if any
    if (seller.openingBalance && seller.openingBalance !== 0) {
      currentBalance = seller.openingBalance;
      statement.push({
        date: seller.createdAt || new Date('2024-01-01'),
        type: 'opening',
        detail: 'Opening Balance',
        purchaseAmount: seller.openingBalance,
        paymentAmount: null,
        balance: currentBalance,
      });
    }

    // ✅ Merge purchases & payments
    const entries = [
      ...purchases.map((p) => ({
        date: p.date,
        type: 'purchase',
        detail: p.invoiceNo || 'Purchase Invoice',
        purchaseAmount: p.amount,
        paymentAmount: null,
      })),
      ...payments.map((pay) => ({
        date: pay.date,
        type: 'payment',
        detail: 'Payment',
        purchaseAmount: null,
        paymentAmount: pay.amountPaid,
      })),
    ];

    // ✅ Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ✅ Process entries sequentially
    entries.forEach((entry) => {
      if (entry.type === 'purchase') {
        totalPurchase += entry.purchaseAmount;
        currentBalance += entry.purchaseAmount;
      } else if (entry.type === 'payment') {
        totalPaid += entry.paymentAmount;
        currentBalance -= entry.paymentAmount;
      }

      statement.push({
        ...entry,
        balance: Math.round(currentBalance * 100) / 100, // ✅ 2 decimals
      });
    });

    // ✅ Response
    res.json({
      sellerName: seller.name,
      gstNo: seller.gstNo,
      openingBalance: seller.openingBalance || 0,
      totalPurchase,
      totalPaid,
      balance: currentBalance,
      statement,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller statement' });
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
    summary.sort((a, b) => a.seller.name.localeCompare(b.seller.name));

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};
