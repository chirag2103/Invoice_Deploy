import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PurchaseInvoice from '../models/PurchaseInvoice.js';
import PurchasePayment from '../models/PurchasePayment.js';

/** Utils **/
const fyLabel = (startYear) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

const getFyRange = (fy) => {
  // fy can be "2025-26" or "2025-2026" or undefined (defaults to current FY)
  const now = new Date();
  // Figure current FY start year
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0=Jan ... 3=Apr
  const currentStartYear = curMonth >= 3 ? curYear : curYear - 1; // FY starts in April (3)
  let startYear;

  if (!fy) {
    startYear = currentStartYear;
  } else {
    const m = String(fy).match(/^(\d{4})\s*-\s*(\d{2}|\d{4})$/);
    if (!m) throw new Error('Invalid fy format. Use 2024-25 or 2024-2025');
    const y1 = parseInt(m[1], 10);
    const y2 = parseInt(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2], 10);
    if (y2 !== y1 + 1)
      throw new Error('FY must be consecutive years, e.g. 2024-25');
    startYear = y1;
  }

  const start = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // Apr 1, 00:00:00 UTC
  const end = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59)); // Mar 31, 23:59:59 UTC

  return { start, end, startYear, label: fyLabel(startYear) };
};

const monthOrder = [
  { m: 4, label: 'Apr' },
  { m: 5, label: 'May' },
  { m: 6, label: 'Jun' },
  { m: 7, label: 'Jul' },
  { m: 8, label: 'Aug' },
  { m: 9, label: 'Sep' },
  { m: 10, label: 'Oct' },
  { m: 11, label: 'Nov' },
  { m: 12, label: 'Dec' },
  { m: 1, label: 'Jan' },
  { m: 2, label: 'Feb' },
  { m: 3, label: 'Mar' },
];

/** Build $match with date window + user */
const matchByUserAndDate = (userId, dateField, start, end, extra = {}) => ({
  $match: {
    user: userId,
    [dateField]: { $gte: start, $lte: end },
    ...extra,
  },
});

/** Generic monthly grouper */
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

/** Map aggregation results into FY month array Apr..Mar */
const mapMonthly = (aggArray, startYear) => {
  const index = new Map();
  aggArray.forEach(({ _id, total, count }) => {
    index.set(`${_id.y}-${_id.m}`, { total, count });
  });

  const months = [];
  monthOrder.forEach(({ m, label }) => {
    const y = m >= 4 ? startYear : startYear + 1;
    const key = `${y}-${m}`;
    const hit = index.get(key) || { total: 0, count: 0 };
    months.push({ key, label, total: hit.total, count: hit.count });
  });
  return months;
};

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
      earliest.getMonth() >= 3
        ? earliest.getFullYear()
        : earliest.getFullYear() - 1;

    const now = new Date();
    const curStartYear =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

    const years = [];
    for (let y = firstStartYear; y <= curStartYear; y++) years.push(fyLabel(y));

    res.json({ years });
  } catch (err) {
    next(err);
  }
};

/** GET /api/analytics/financial-year?fy=2025-26 */
export const getFinancialYearAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fy } = req.query;
    const { start, end, startYear, label } = getFyRange(fy);

    // 1) Invoices (grandTotal), date field: "date"
    const invMatch = matchByUserAndDate(userId, 'date', start, end);
    const invMonthlyAgg = await Invoice.aggregate([
      invMatch,
      { $project: { date: 1, amount: '$grandTotal' } },
      ...groupByMonth('date', 'amount'),
    ]);
    const invMonthly = mapMonthly(invMonthlyAgg, startYear);
    const invoicesFYTotal = invMonthly.reduce((s, m) => s + (m.total || 0), 0);

    // 2) Customer payments received, date field: "date"
    const payMatch = matchByUserAndDate(userId, 'date', start, end);
    const payMonthlyAgg = await Payment.aggregate([
      payMatch,
      { $project: { date: 1, amount: '$amountPaid' } },
      ...groupByMonth('date', 'amount'),
    ]);
    const payMonthly = mapMonthly(payMonthlyAgg, startYear);
    const paymentsFYTotal = payMonthly.reduce((s, m) => s + (m.total || 0), 0);

    // 3) Seller bills added (PurchaseInvoice.amount), date field: "date"
    const pbMatch = matchByUserAndDate(userId, 'date', start, end);
    const pbMonthlyAgg = await PurchaseInvoice.aggregate([
      pbMatch,
      { $project: { date: 1, amount: '$amount' } },
      ...groupByMonth('date', 'amount'),
    ]);
    const pbMonthly = mapMonthly(pbMonthlyAgg, startYear);
    const sellerBillsFYTotal = pbMonthly.reduce(
      (s, m) => s + (m.total || 0),
      0
    );

    // 4) Payments to sellers (PurchasePayment.amountPaid), date field: "date"
    const spMatch = matchByUserAndDate(userId, 'date', start, end);
    const spMonthlyAgg = await PurchasePayment.aggregate([
      spMatch,
      { $project: { date: 1, amount: '$amountPaid' } },
      ...groupByMonth('date', 'amount'),
    ]);
    const spMonthly = mapMonthly(spMonthlyAgg, startYear);
    const sellerPaymentsFYTotal = spMonthly.reduce(
      (s, m) => s + (m.total || 0),
      0
    );

    // Merge months Apr..Mar into one table row per month
    const monthly = monthOrder.map(({ label }, i) => ({
      month: label,
      totalInvoices: invMonthly[i]?.total || 0,
      totalPaymentsReceived: payMonthly[i]?.total || 0,
      totalSellerBills: pbMonthly[i]?.total || 0,
      totalSellerPayments: spMonthly[i]?.total || 0,
      // If you distinguish “transactions received” separately, keep it;
      // here it’s same as payments received:
      totalTransactionsReceived: payMonthly[i]?.total || 0,
      totalTransactionsPaidToSeller: spMonthly[i]?.total || 0,
    }));

    res.json({
      fyLabel: label,
      range: { start, end },
      totals: {
        invoices: invoicesFYTotal,
        paymentsReceived: paymentsFYTotal,
        sellerBillsAdded: sellerBillsFYTotal,
        transactionsReceived: paymentsFYTotal,
        transactionsPaidToSellers: sellerPaymentsFYTotal,
      },
      monthly,
    });
  } catch (err) {
    next(err);
  }
};
