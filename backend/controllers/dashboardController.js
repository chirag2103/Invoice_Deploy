import catchAsyncError from '../middlewares/catchAsyncError.js';
import Invoice from '../models/invoiceModel.js';
import Quotation from '../models/quotationModel.js';
import Challan from '../models/challanModel.js';
import { ROLES } from '../config/roles.js';

// Get dashboard statistics
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = new Date();

  let query = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  // Get invoice stats
  const invoiceStats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] },
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$total', 0] },
        },
        totalOverdue: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0] },
        },
      },
    },
  ]);

  // Get quotation stats
  const quotationStats = await Quotation.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalQuotations: { $sum: 1 },
      },
    },
  ]);

  // Get challan stats
  const challanStats = await Challan.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalChallans: { $sum: 1 },
      },
    },
  ]);

  // Get recent invoices
  const recentInvoices = await Invoice.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name');

  // Get recent quotations
  const recentQuotations = await Quotation.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name');

  // Get recent challans
  const recentChallans = await Challan.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name');

  res.status(200).json({
    success: true,
    totalInvoices: invoiceStats[0]?.totalInvoices || 0,
    totalQuotations: quotationStats[0]?.totalQuotations || 0,
    totalChallans: challanStats[0]?.totalChallans || 0,
    totalRevenue: invoiceStats[0]?.totalRevenue || 0,
    totalPaid: invoiceStats[0]?.totalPaid || 0,
    totalPending: invoiceStats[0]?.totalPending || 0,
    totalOverdue: invoiceStats[0]?.totalOverdue || 0,
    recentInvoices,
    recentQuotations,
    recentChallans,
  });
});
