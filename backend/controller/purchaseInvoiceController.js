import PurchaseInvoice from '../models/PurchaseInvoice.js';
import PurchasePayment from '../models/PurchasePayment.js';
import Seller from '../models/Seller.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';

const parseQueryDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(
    endOfDay ? `${value}T23:59:59.999` : `${value}T00:00:00.000`
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateMatch = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return undefined;
  }

  const dateMatch = {};

  if (startDate) {
    dateMatch.$gte = startDate;
  }

  if (endDate) {
    dateMatch.$lte = endDate;
  }

  return dateMatch;
};

export const createPurchaseInvoice = async (req, res, next) => {
  try {
    const { seller, invoiceNo, amount, date, remarks } = req.body;

    if (!seller || !amount || !date) {
      return next(
        new ErrorHandler('Seller, Amount, and Date are required', 400)
      );
    }

    const newPurchase = await PurchaseInvoice.create({
      seller,
      invoiceNo,
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

export const getAllPurchases = async (req, res, next) => {
  try {
    const allPurchases = await PurchaseInvoice.find({ user: req.user._id })
      .populate('seller', 'name')
      .sort({ date: -1 });

    const { results, pagination } = filterAndPaginate(
      allPurchases,
      req.query,
      ['seller.name', 'invoiceNo', 'amount', 'date', 'remarks']
    );

    res.status(200).json({
      success: true,
      purchases: results,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

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

export const deletePurchaseInvoice = async (req, res, next) => {
  try {
    const purchase = await PurchaseInvoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!purchase) {
      return next(new ErrorHandler('Purchase invoice not found', 404));
    }

    // Payments are recorded at the seller/account level, not against a single
    // bill, so deleting one bill must NOT remove that seller's payment history.

    res.status(200).json({
      success: true,
      message: 'Purchase invoice deleted',
    });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseSummaryBySeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findOne({
      _id: sellerId,
      user: req.user._id,
    }).select('name openingBalance');

    if (!seller) {
      return next(new ErrorHandler('Seller not found', 404));
    }

    const [invoiceSummary, paymentSummary] = await Promise.all([
      PurchaseInvoice.aggregate([
        { $match: { user: req.user._id, seller: seller._id } },
        { $group: { _id: null, totalBills: { $sum: '$amount' } } },
      ]),
      PurchasePayment.aggregate([
        { $match: { user: req.user._id, seller: seller._id } },
        { $group: { _id: null, totalPaid: { $sum: '$amountPaid' } } },
      ]),
    ]);

    const totalBills = invoiceSummary[0]?.totalBills || 0;
    const totalPaid = paymentSummary[0]?.totalPaid || 0;

    res.status(200).json({
      success: true,
      summary: {
        seller: { _id: seller._id, name: seller.name },
        totalBills,
        totalPaid,
        remaining: Number(seller.openingBalance || 0) + totalBills - totalPaid,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerStatement = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { from, to } = req.query;

    const seller = await Seller.findOne({
      _id: sellerId,
      user: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const fromDate = parseQueryDate(from);
    const toDate = parseQueryDate(to, true);

    const purchases = await PurchaseInvoice.find({
      seller: sellerId,
      user: req.user._id,
    }).sort({ date: 1 });

    const payments = await PurchasePayment.find({
      seller: sellerId,
      user: req.user._id,
    }).sort({ date: 1 });

    const statement = [];
    let totalPurchase = 0;
    let totalPaid = 0;
    let currentBalance = 0;
    let openingBalance = Number(seller.openingBalance || 0);

    const allEntries = [
      ...purchases.map((purchase) => ({
        date: purchase.date,
        type: 'purchase',
        detail: purchase.invoiceNo
          ? `Purchase Invoice - ${purchase.invoiceNo}`
          : 'Purchase Invoice',
        purchaseAmount: purchase.amount,
        paymentAmount: null,
      })),
      ...payments.map((payment) => ({
        date: payment.date,
        type: 'payment',
        detail: payment.remarks?.trim() || 'Payment',
        purchaseAmount: null,
        paymentAmount: payment.amountPaid,
      })),
    ].map((entry) => ({
      ...entry,
      timestamp: new Date(entry.date),
    }));

    allEntries.sort((first, second) => first.timestamp - second.timestamp);

    if (fromDate) {
      const preRangeEntries = allEntries.filter((entry) => entry.timestamp < fromDate);
      preRangeEntries.forEach((entry) => {
        if (entry.type === 'purchase') {
          openingBalance += Number(entry.purchaseAmount || 0);
        } else {
          openingBalance -= Number(entry.paymentAmount || 0);
        }
      });
    }

    if (openingBalance !== 0) {
      currentBalance = openingBalance;
      statement.push({
        date: fromDate || seller.createdAt || new Date('2024-01-01'),
        type: 'opening',
        detail: fromDate ? `Opening Balance (as of ${from})` : 'Opening Balance',
        purchaseAmount: openingBalance > 0 ? openingBalance : null,
        paymentAmount: openingBalance < 0 ? Math.abs(openingBalance) : null,
        balance: currentBalance,
      });
    }

    const rangeEntries = fromDate
      ? allEntries.filter((entry) => {
          return (
            entry.timestamp >= fromDate && (!toDate || entry.timestamp <= toDate)
          );
        })
      : allEntries;

    rangeEntries.forEach((entry) => {
      if (entry.type === 'purchase') {
        totalPurchase += Number(entry.purchaseAmount || 0);
        currentBalance += Number(entry.purchaseAmount || 0);
      } else {
        totalPaid += Number(entry.paymentAmount || 0);
        currentBalance -= Number(entry.paymentAmount || 0);
      }

      statement.push({
        date: entry.date,
        type: entry.type,
        detail: entry.detail,
        purchaseAmount: entry.purchaseAmount,
        paymentAmount: entry.paymentAmount,
        balance: Math.round(currentBalance * 100) / 100,
      });
    });

    res.json({
      sellerName: seller.name,
      sellerAddress: seller.address || '',
      gstNo: seller.gstNo || '',
      openingBalance,
      totalPurchase,
      totalPaid,
      balance: currentBalance,
      statement,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllSellerSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = buildDateMatch(
      parseQueryDate(startDate),
      parseQueryDate(endDate, true)
    );

    const sellers = await Seller.find({ user: req.user._id })
      .select('name openingBalance')
      .lean();

    const [invoiceGroups, paymentGroups] = await Promise.all([
      PurchaseInvoice.aggregate([
        {
          $match: {
            user: req.user._id,
            ...(dateMatch ? { date: dateMatch } : {}),
          },
        },
        {
          $group: {
            _id: '$seller',
            totalBills: { $sum: '$amount' },
          },
        },
      ]),
      PurchasePayment.aggregate([
        {
          $match: {
            user: req.user._id,
            ...(dateMatch ? { date: dateMatch } : {}),
          },
        },
        {
          $group: {
            _id: '$seller',
            totalPaid: { $sum: '$amountPaid' },
          },
        },
      ]),
    ]);

    const invoiceMap = new Map(
      invoiceGroups.map((entry) => [String(entry._id), entry.totalBills || 0])
    );
    const paymentMap = new Map(
      paymentGroups.map((entry) => [String(entry._id), entry.totalPaid || 0])
    );

    const summary = sellers
      .map((seller) => {
        const sellerId = String(seller._id);
        const totalBills = invoiceMap.get(sellerId) || 0;
        const totalPaid = paymentMap.get(sellerId) || 0;

        if (totalBills === 0 && totalPaid === 0 && !seller.openingBalance) {
          return null;
        }

        return {
          seller: {
            _id: seller._id,
            name: seller.name,
          },
          totalBills,
          totalPaid,
          remaining: Number(seller.openingBalance || 0) + totalBills - totalPaid,
        };
      })
      .filter(Boolean)
      .sort((first, second) => first.seller.name.localeCompare(second.seller.name));

    const { results, pagination } = filterAndPaginate(summary, req.query, [
      'seller.name',
      'totalBills',
      'totalPaid',
      'remaining',
    ]);

    res.status(200).json({
      success: true,
      summary: results,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
