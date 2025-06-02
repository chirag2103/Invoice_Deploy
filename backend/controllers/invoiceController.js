import Invoice from '../models/invoiceModel.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { ROLES } from '../config/roles.js';

// Create new invoice
export const createInvoice = catchAsyncError(async (req, res, next) => {
  // Validate required fields
  const { customer, items, dueDate, placeOfSupply } = req.body;
  if (!customer || !items || !dueDate || !placeOfSupply) {
    return next(new ErrorHandler('Please provide all required fields', 400));
  }

  // Validate customer exists and belongs to user
  const customerExists = await Customer.findOne({
    _id: customer,
    createdBy: req.user.id,
  });
  if (!customerExists) {
    return next(new ErrorHandler('Customer not found', 404));
  }

  // Calculate totals
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  items.forEach((item) => {
    item.amount = item.quantity * item.price;
    subtotal += item.amount;

    // Calculate GST based on place of supply
    if (placeOfSupply === customerExists.address.split(',').pop().trim()) {
      // Same state - CGST & SGST
      item.cgst.amount = (item.amount * item.cgst.rate) / 100;
      item.sgst.amount = (item.amount * item.sgst.rate) / 100;
      item.igst.amount = 0;
      item.igst.rate = 0;

      totalCgst += item.cgst.amount;
      totalSgst += item.sgst.amount;
    } else {
      // Different state - IGST
      item.igst.amount = (item.amount * item.igst.rate) / 100;
      item.cgst.amount = 0;
      item.cgst.rate = 0;
      item.sgst.amount = 0;
      item.sgst.rate = 0;

      totalIgst += item.igst.amount;
    }
  });

  const total = subtotal + totalCgst + totalSgst + totalIgst;
  const roundOff = Math.round(total) - total;

  // Generate invoice number
  const lastInvoice = await Invoice.findOne({
    createdBy: req.user.id,
  }).sort({ createdAt: -1 });

  let invoiceNumber;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('/').pop());
    invoiceNumber = `INV/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/${(lastNumber + 1)
      .toString()
      .padStart(4, '0')}`;
  } else {
    invoiceNumber = `INV/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/0001`;
  }

  const invoiceData = {
    ...req.body,
    invoiceNumber,
    createdBy: req.user.id,
    items,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    total: Math.round(total),
    roundOff,
  };

  const invoice = await Invoice.create(invoiceData);
  await invoice.populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails bankDetails' },
  ]);

  res.status(201).json({
    success: true,
    invoice,
  });
});

// Get all invoices (admin/manager only)
export const getAllInvoices = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};

  // If manager, only show invoices from their company
  if (req.user.role === ROLES.MANAGER) {
    query.createdBy = {
      $in: await getUsersInCompany(req.user.companyDetails.gstin),
    };
  }

  // Add filters
  if (req.query.status) query.status = req.query.status;
  if (req.query.customer) query.customer = req.query.customer;
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    invoices,
  });
});

// Get user's own invoices
export const getMyInvoices = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = { createdBy: req.user.id };

  // Add filters
  if (req.query.status) query.status = req.query.status;
  if (req.query.customer) query.customer = req.query.customer;
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('customer', 'name gstNo address')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    invoices,
  });
});

// Get single invoice by ID
export const getInvoiceById = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails bankDetails');

  if (!invoice) {
    return next(new ErrorHandler('Invoice not found', 404));
  }

  // Check if user has access to this invoice
  if (
    req.user.role !== ROLES.ADMIN &&
    invoice.createdBy._id.toString() !== req.user.id &&
    req.user.role !== ROLES.MANAGER
  ) {
    return next(new ErrorHandler('Not authorized to access this invoice', 403));
  }

  res.status(200).json({
    success: true,
    invoice,
  });
});

// Update invoice
export const updateInvoice = catchAsyncError(async (req, res, next) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new ErrorHandler('Invoice not found', 404));
  }

  // Check if user has permission to update
  if (
    invoice.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(new ErrorHandler('Not authorized to update this invoice', 403));
  }

  // Don't allow updates if invoice is paid
  if (invoice.status === 'paid') {
    return next(new ErrorHandler('Cannot update a paid invoice', 400));
  }

  // Recalculate totals if items are updated
  if (req.body.items) {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    req.body.items.forEach((item) => {
      item.amount = item.quantity * item.price;
      subtotal += item.amount;

      if (
        req.body.placeOfSupply ===
        invoice.customer.address.split(',').pop().trim()
      ) {
        item.cgst.amount = (item.amount * item.cgst.rate) / 100;
        item.sgst.amount = (item.amount * item.sgst.rate) / 100;
        item.igst.amount = 0;
        item.igst.rate = 0;

        totalCgst += item.cgst.amount;
        totalSgst += item.sgst.amount;
      } else {
        item.igst.amount = (item.amount * item.igst.rate) / 100;
        item.cgst.amount = 0;
        item.cgst.rate = 0;
        item.sgst.amount = 0;
        item.sgst.rate = 0;

        totalIgst += item.igst.amount;
      }
    });

    const total = subtotal + totalCgst + totalSgst + totalIgst;
    const roundOff = Math.round(total) - total;

    req.body.subtotal = subtotal;
    req.body.totalCgst = totalCgst;
    req.body.totalSgst = totalSgst;
    req.body.totalIgst = totalIgst;
    req.body.total = Math.round(total);
    req.body.roundOff = roundOff;
  }

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails bankDetails' },
  ]);

  res.status(200).json({
    success: true,
    invoice,
  });
});

// Delete invoice
export const deleteInvoice = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new ErrorHandler('Invoice not found', 404));
  }

  // Check if user has permission to delete
  if (
    invoice.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(new ErrorHandler('Not authorized to delete this invoice', 403));
  }

  // Don't allow deletion if invoice is paid
  if (invoice.status === 'paid') {
    return next(new ErrorHandler('Cannot delete a paid invoice', 400));
  }

  await invoice.remove();

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully',
  });
});

// Get invoice statistics
export const getInvoiceStats = catchAsyncError(async (req, res, next) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

  let query = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (req.user.role !== ROLES.ADMIN) {
    query.createdBy = req.user.id;
  }

  const stats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
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
        totalOverdue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0],
          },
        },
      },
    },
  ]);

  const monthlyStats = await Invoice.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        total: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    stats: stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
    },
    monthlyStats,
  });
});

// Helper function to get all users in a company
const getUsersInCompany = async (gstin) => {
  const users = await User.find({ 'companyDetails.gstin': gstin }).select(
    '_id'
  );
  return users.map((user) => user._id);
};
