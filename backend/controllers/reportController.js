import Invoice from '../models/invoiceModel.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { ROLES } from '../config/roles.js';
import ExcelJS from 'exceljs';

// Generate monthly revenue report
export const getMonthlyRevenue = catchAsyncError(async (req, res, next) => {
  const { year, month } = req.query;

  // Validate year and month
  if (!year || !month) {
    return next(new ErrorHandler('Please provide year and month', 400));
  }

  let query = {
    status: 'paid',
  };

  // If not admin, only show user's data
  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  query.createdAt = {
    $gte: startDate,
    $lte: endDate,
  };

  const stats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalCgst: { $sum: '$totalCgst' },
        totalSgst: { $sum: '$totalSgst' },
        totalIgst: { $sum: '$totalIgst' },
        invoiceCount: { $sum: 1 },
        averageInvoiceValue: { $avg: '$total' },
      },
    },
  ]);

  // Get daily revenue
  const dailyRevenue = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dayOfMonth: '$createdAt' },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get payment mode distribution
  const paymentModeStats = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        date: { $gte: startDate, $lte: endDate },
        ...(req.user.role !== ROLES.ADMIN && { createdBy: req.user.id }),
      },
    },
    {
      $group: {
        _id: '$paymentMode',
        amount: { $sum: '$amountPaid' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get top customers
  const topCustomers = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$customer',
        totalAmount: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 1,
        totalAmount: 1,
        invoiceCount: 1,
        'customer.name': 1,
        'customer.gstNo': 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: stats[0] || {
        totalRevenue: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        invoiceCount: 0,
        averageInvoiceValue: 0,
      },
      period: { year, month },
      dailyRevenue,
      paymentModeStats,
      topCustomers,
    },
  });
});

// Export invoices to Excel
export const exportInvoicesToExcel = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  // Validate dates
  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide start and end dates', 400));
  }

  let query = {};

  // If not admin, only show user's data
  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  query.createdAt = {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  };

  const invoices = await Invoice.find(query)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Add headers
  worksheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
    { header: 'Date', key: 'createdAt', width: 12 },
    { header: 'Customer Name', key: 'customerName', width: 30 },
    { header: 'Customer GST', key: 'customerGst', width: 20 },
    { header: 'Place of Supply', key: 'placeOfSupply', width: 15 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'CGST', key: 'cgst', width: 12 },
    { header: 'SGST', key: 'sgst', width: 12 },
    { header: 'IGST', key: 'igst', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created By', key: 'createdBy', width: 20 },
    { header: 'Company GSTIN', key: 'companyGstin', width: 20 },
  ];

  // Add rows
  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt.toLocaleDateString(),
      customerName: invoice.customer.name,
      customerGst: invoice.customer.gstNo,
      placeOfSupply: invoice.placeOfSupply,
      subtotal: invoice.subtotal,
      cgst: invoice.totalCgst,
      sgst: invoice.totalSgst,
      igst: invoice.totalIgst,
      total: invoice.total,
      status: invoice.status,
      createdBy: invoice.createdBy.name,
      companyGstin: invoice.createdBy.companyDetails.gstin,
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Format number columns
  ['F', 'G', 'H', 'I', 'J'].forEach((col) => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
  });

  // Add totals row
  const lastRow = worksheet.rowCount + 1;
  worksheet.addRow({
    invoiceNumber: 'Total',
    subtotal: {
      formula: `SUM(F2:F${lastRow - 1})`,
    },
    cgst: {
      formula: `SUM(G2:G${lastRow - 1})`,
    },
    sgst: {
      formula: `SUM(H2:H${lastRow - 1})`,
    },
    igst: {
      formula: `SUM(I2:I${lastRow - 1})`,
    },
    total: {
      formula: `SUM(J2:J${lastRow - 1})`,
    },
  });
  worksheet.getRow(lastRow).font = { bold: true };

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=invoices-report-${startDate}-to-${endDate}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// Get GST report
export const getGstReport = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  // Validate dates
  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide start and end dates', 400));
  }

  let query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  // If not admin, only show user's data
  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  const gstStats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalCgst: { $sum: '$totalCgst' },
        totalSgst: { $sum: '$totalSgst' },
        totalIgst: { $sum: '$totalIgst' },
        totalTaxableValue: { $sum: '$subtotal' },
      },
    },
  ]);

  // Get state-wise GST distribution
  const stateWiseGst = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$placeOfSupply',
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalCgst: { $sum: '$totalCgst' },
        totalSgst: { $sum: '$totalSgst' },
        totalIgst: { $sum: '$totalIgst' },
        taxableValue: { $sum: '$subtotal' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  // Get HSN code-wise summary
  const hsnSummary = await Invoice.aggregate([
    { $match: query },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.hsnCode',
        description: { $first: '$items.description' },
        quantity: { $sum: '$items.quantity' },
        taxableValue: { $sum: '$items.amount' },
        cgst: { $sum: '$items.cgst.amount' },
        sgst: { $sum: '$items.sgst.amount' },
        igst: { $sum: '$items.igst.amount' },
      },
    },
    { $sort: { taxableValue: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: gstStats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalTaxableValue: 0,
      },
      stateWiseGst,
      hsnSummary,
      period: { startDate, endDate },
    },
  });
});

// Get customer report
export const getCustomerReport = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  // Validate dates
  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide start and end dates', 400));
  }

  let query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  // If not admin, only show user's data
  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  // Get customer-wise sales
  const customerStats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$customer',
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0],
          },
        },
        totalPending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$total', 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 1,
        invoiceCount: 1,
        totalAmount: 1,
        totalPaid: 1,
        totalPending: 1,
        'customer.name': 1,
        'customer.gstNo': 1,
        'customer.address': 1,
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  // Get payment mode distribution
  const paymentModeStats = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        ...(req.user.role !== ROLES.ADMIN && { createdBy: req.user.id }),
      },
    },
    {
      $group: {
        _id: '$paymentMode',
        amount: { $sum: '$amountPaid' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      customers: customerStats,
      paymentModes: paymentModeStats,
      period: { startDate, endDate },
    },
  });
});
