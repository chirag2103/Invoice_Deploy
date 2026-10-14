import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PurchaseInvoice from '../models/PurchaseInvoice.js';
import PurchasePayment from '../models/PurchasePayment.js';
import {
  formatFinancialYearLabel,
  getFinancialYearDateRange,
} from '../utils/financialYear.js';

const MONTH_ORDER = [
  { m: 4, label: 'April' },
  { m: 5, label: 'May' },
  { m: 6, label: 'June' },
  { m: 7, label: 'July' },
  { m: 8, label: 'August' },
  { m: 9, label: 'September' },
  { m: 10, label: 'October' },
  { m: 11, label: 'November' },
  { m: 12, label: 'December' },
  { m: 1, label: 'January' },
  { m: 2, label: 'February' },
  { m: 3, label: 'March' },
];

const matchByUserAndDate = (userId, dateField, start, end) => ({
  $match: { user: userId, [dateField]: { $gte: start, $lte: end } },
});

const groupByMonth = (dateField, amountField) => [
  {
    $group: {
      _id: {
        y: { $year: { date: `$${dateField}`, timezone: 'UTC' } },
        m: { $month: { date: `$${dateField}`, timezone: 'UTC' } },
      },
      total: { $sum: `$${amountField}` },
      count: { $sum: 1 },
    },
  },
];

/** Map aggregation results into an Apr..Mar array. */
const mapMonthly = (aggArray, startYear) => {
  const index = new Map();
  aggArray.forEach(({ _id, total, count }) => {
    index.set(`${_id.y}-${_id.m}`, { total, count });
  });

  return MONTH_ORDER.map(({ m, label }) => {
    const y = m >= 4 ? startYear : startYear + 1;
    const hit = index.get(`${y}-${m}`) || { total: 0, count: 0 };
    return {
      month: label,
      monthKey: `${y}-${String(m).padStart(2, '0')}`,
      total: hit.total,
      count: hit.count,
    };
  });
};

const sumTotal = (monthly) => monthly.reduce((s, m) => s + (m.total || 0), 0);
const sumCount = (monthly) => monthly.reduce((s, m) => s + (m.count || 0), 0);

/** GET /api/analytics/financial-years */
export const getFinancialYears = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const earliestDates = await Promise.all([
      Invoice.findOne({ user: userId }).sort({ date: 1 }).select('date -_id'),
      Payment.findOne({ user: userId }).sort({ date: 1 }).select('date -_id'),
      PurchaseInvoice.findOne({ user: userId })
        .sort({ date: 1 })
        .select('date -_id'),
      PurchasePayment.findOne({ user: userId })
        .sort({ date: 1 })
        .select('date -_id'),
    ]);

    const dates = earliestDates.map((d) => d?.date).filter(Boolean);
    if (dates.length === 0) return res.json({ years: [] });

    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const firstStartYear =
      earliest.getUTCMonth() >= 3
        ? earliest.getUTCFullYear()
        : earliest.getUTCFullYear() - 1;

    const now = new Date();
    const curStartYear =
      now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;

    const years = [];
    for (let y = firstStartYear; y <= curStartYear; y += 1) {
      years.push(formatFinancialYearLabel(y));
    }

    res.json({ years });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/summary?fy=25-26
 * Everything the Dashboard needs in one call, computed server-side via
 * aggregation instead of the client loading every invoice/payment and
 * reducing over them in the browser.
 */
export const getFinancialYearSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fy = req.query.fy || req.query.financialYear;
    const { startDate, endDate, financialYearStart, financialYearLabel } =
      getFinancialYearDateRange(fy);

    const [invMonthlyAgg, payMonthlyAgg, pbMonthlyAgg, spMonthlyAgg] =
      await Promise.all([
        Invoice.aggregate([
          matchByUserAndDate(userId, 'date', startDate, endDate),
          { $project: { date: 1, amount: '$grandTotal' } },
          ...groupByMonth('date', 'amount'),
        ]),
        Payment.aggregate([
          matchByUserAndDate(userId, 'date', startDate, endDate),
          { $project: { date: 1, amount: '$amountPaid' } },
          ...groupByMonth('date', 'amount'),
        ]),
        PurchaseInvoice.aggregate([
          matchByUserAndDate(userId, 'date', startDate, endDate),
          { $project: { date: 1, amount: '$amount' } },
          ...groupByMonth('date', 'amount'),
        ]),
        PurchasePayment.aggregate([
          matchByUserAndDate(userId, 'date', startDate, endDate),
          { $project: { date: 1, amount: '$amountPaid' } },
          ...groupByMonth('date', 'amount'),
        ]),
      ]);

    const invMonthly = mapMonthly(invMonthlyAgg, financialYearStart);
    const payMonthly = mapMonthly(payMonthlyAgg, financialYearStart);
    const pbMonthly = mapMonthly(pbMonthlyAgg, financialYearStart);
    const spMonthly = mapMonthly(spMonthlyAgg, financialYearStart);

    const revenue = sumTotal(invMonthly);
    const receipts = sumTotal(payMonthly);
    const purchaseBills = sumTotal(pbMonthly);
    const sellerPayments = sumTotal(spMonthly);
    const invoiceCount = sumCount(invMonthly);

    const outstandingReceivables = revenue - receipts;
    const pendingPayables = purchaseBills - sellerPayments;
    const netCashFlow = receipts - sellerPayments;

    const monthly = invMonthly.map((m, i) => ({
      month: m.month,
      monthKey: m.monthKey,
      invoiceCount: m.count,
      totalInvoices: m.total,
      totalPayments: payMonthly[i].total,
      totalSellerBills: pbMonthly[i].total,
      totalSellerPayments: spMonthly[i].total,
    }));

    const bestMonth = [...monthly].sort(
      (a, b) => b.totalInvoices - a.totalInvoices
    )[0];
    const busiestMonth = [...monthly].sort(
      (a, b) => b.invoiceCount - a.invoiceCount
    )[0];

    const recentInvoices = await Invoice.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('customer', 'name')
      .select('invoiceNo financialYearLabel customer date grandTotal')
      .lean();

    res.json({
      financialYearLabel,
      financialYearStart,
      range: { start: startDate, end: endDate },
      totals: {
        revenue,
        receipts,
        purchaseBills,
        sellerPayments,
        outstandingReceivables,
        pendingPayables,
        netCashFlow,
        invoiceCount,
      },
      highlights: {
        averageInvoiceValue: invoiceCount ? revenue / invoiceCount : 0,
        collectionEfficiency: revenue ? (receipts / revenue) * 100 : 0,
        bestMonth: bestMonth?.totalInvoices ? bestMonth : null,
        busiestMonth: busiestMonth?.invoiceCount ? busiestMonth : null,
      },
      monthly,
      recentInvoices,
    });
  } catch (err) {
    next(err);
  }
};
