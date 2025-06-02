import Quotation from '../models/quotationModel.js';
import Invoice from '../models/invoiceModel.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { ROLES } from '../config/roles.js';

// Create new quotation
export const createQuotation = catchAsyncError(async (req, res, next) => {
  // Validate required fields
  const { customer, items, validUntil, placeOfSupply } = req.body;
  if (!customer || !items || !validUntil || !placeOfSupply) {
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

  // Generate quotation number
  const lastQuotation = await Quotation.findOne({
    createdBy: req.user.id,
  }).sort({ createdAt: -1 });

  let quotationNumber;
  if (lastQuotation) {
    const lastNumber = parseInt(lastQuotation.quotationNumber.split('/').pop());
    quotationNumber = `QTN/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/${(lastNumber + 1)
      .toString()
      .padStart(4, '0')}`;
  } else {
    quotationNumber = `QTN/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/0001`;
  }

  const quotationData = {
    ...req.body,
    quotationNumber,
    createdBy: req.user.id,
    items,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    total: Math.round(total),
    roundOff,
  };

  const quotation = await Quotation.create(quotationData);
  await quotation.populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails bankDetails' },
  ]);

  res.status(201).json({
    success: true,
    quotation,
  });
});

// Get all quotations (admin/manager only)
export const getAllQuotations = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};

  // If manager, only show quotations from their company
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

  const total = await Quotation.countDocuments(query);
  const quotations = await Quotation.find(query)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: quotations.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    quotations,
  });
});

// Get user's own quotations
export const getMyQuotations = catchAsyncError(async (req, res, next) => {
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

  const total = await Quotation.countDocuments(query);
  const quotations = await Quotation.find(query)
    .populate('customer', 'name gstNo address')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: quotations.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    quotations,
  });
});

// Get single quotation by ID
export const getQuotationById = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails bankDetails')
    .populate('convertedInvoice');

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  // Check if user has access to this quotation
  if (
    req.user.role !== ROLES.ADMIN &&
    quotation.createdBy._id.toString() !== req.user.id &&
    req.user.role !== ROLES.MANAGER
  ) {
    return next(
      new ErrorHandler('Not authorized to access this quotation', 403)
    );
  }

  res.status(200).json({
    success: true,
    quotation,
  });
});

// Update quotation
export const updateQuotation = catchAsyncError(async (req, res, next) => {
  let quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  // Check if user has permission to update
  if (
    quotation.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(
      new ErrorHandler('Not authorized to update this quotation', 403)
    );
  }

  // Don't allow updates if quotation is accepted or expired
  if (['accepted', 'expired'].includes(quotation.status)) {
    return next(
      new ErrorHandler(`Cannot update a ${quotation.status} quotation`, 400)
    );
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
        quotation.customer.address.split(',').pop().trim()
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

  quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails bankDetails' },
  ]);

  res.status(200).json({
    success: true,
    quotation,
  });
});

// Delete quotation
export const deleteQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  // Check if user has permission to delete
  if (
    quotation.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(
      new ErrorHandler('Not authorized to delete this quotation', 403)
    );
  }

  // Don't allow deletion if quotation is accepted
  if (quotation.status === 'accepted') {
    return next(new ErrorHandler('Cannot delete an accepted quotation', 400));
  }

  await quotation.remove();

  res.status(200).json({
    success: true,
    message: 'Quotation deleted successfully',
  });
});

// Convert quotation to invoice
export const convertToInvoice = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id).populate(
    'customer',
    'name gstNo address'
  );

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  // Check if user has permission
  if (
    quotation.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(
      new ErrorHandler('Not authorized to convert this quotation', 403)
    );
  }

  // Check if already converted
  if (quotation.convertedToInvoice) {
    return next(
      new ErrorHandler('Quotation already converted to invoice', 400)
    );
  }

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

  // Create invoice from quotation
  const invoice = await Invoice.create({
    invoiceNumber,
    customer: quotation.customer,
    createdBy: req.user.id,
    items: quotation.items,
    subtotal: quotation.subtotal,
    totalCgst: quotation.totalCgst,
    totalSgst: quotation.totalSgst,
    totalIgst: quotation.totalIgst,
    total: quotation.total,
    roundOff: quotation.roundOff,
    notes: quotation.notes,
    placeOfSupply: quotation.placeOfSupply,
    isReverseCharge: quotation.isReverseCharge,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  // Update quotation
  quotation.status = 'accepted';
  quotation.convertedToInvoice = true;
  quotation.convertedInvoiceId = invoice._id;
  await quotation.save();

  await invoice.populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails bankDetails' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Quotation converted to invoice successfully',
    invoice,
  });
});

// Helper function to get all users in a company
const getUsersInCompany = async (gstin) => {
  const users = await User.find({ 'companyDetails.gstin': gstin }).select(
    '_id'
  );
  return users.map((user) => user._id);
};
