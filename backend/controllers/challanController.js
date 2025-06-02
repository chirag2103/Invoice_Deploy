import Challan from '../models/challanModel.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { ROLES } from '../config/roles.js';

// Create new challan
export const createChallan = catchAsyncError(async (req, res, next) => {
  // Validate required fields
  const { customer, items, deliveryDate, deliveryAddress, contactPerson } =
    req.body;
  if (
    !customer ||
    !items ||
    !deliveryDate ||
    !deliveryAddress ||
    !contactPerson
  ) {
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

  // Generate challan number
  const lastChallan = await Challan.findOne({
    createdBy: req.user.id,
  }).sort({ createdAt: -1 });

  let challanNumber;
  if (lastChallan) {
    const lastNumber = parseInt(lastChallan.challanNumber.split('/').pop());
    challanNumber = `DC/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/${(lastNumber + 1)
      .toString()
      .padStart(4, '0')}`;
  } else {
    challanNumber = `DC/${
      req.user.companyDetails.gstin
    }/${new Date().getFullYear()}/0001`;
  }

  // Validate contact person
  if (!contactPerson.name || !contactPerson.phone) {
    return next(new ErrorHandler('Please provide contact person details', 400));
  }

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    return next(new ErrorHandler('Please provide at least one item', 400));
  }

  items.forEach((item) => {
    if (!item.description || !item.quantity || !item.unit) {
      return next(new ErrorHandler('Please provide all item details', 400));
    }
    if (item.quantity <= 0) {
      return next(
        new ErrorHandler('Item quantity must be greater than 0', 400)
      );
    }
  });

  const challanData = {
    ...req.body,
    challanNumber,
    createdBy: req.user.id,
  };

  const challan = await Challan.create(challanData);
  await challan.populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails' },
  ]);

  res.status(201).json({
    success: true,
    challan,
  });
});

// Get all challans (admin/manager only)
export const getAllChallans = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};

  // If manager, only show challans from their company
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

  const total = await Challan.countDocuments(query);
  const challans = await Challan.find(query)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: challans.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    challans,
  });
});

// Get user's own challans
export const getMyChallans = catchAsyncError(async (req, res, next) => {
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

  const total = await Challan.countDocuments(query);
  const challans = await Challan.find(query)
    .populate('customer', 'name gstNo address')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: challans.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    challans,
  });
});

// Get single challan by ID
export const getChallanById = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findById(req.params.id)
    .populate('customer', 'name gstNo address')
    .populate('createdBy', 'name companyDetails');

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  // Check if user has access to this challan
  if (
    req.user.role !== ROLES.ADMIN &&
    challan.createdBy._id.toString() !== req.user.id &&
    req.user.role !== ROLES.MANAGER
  ) {
    return next(new ErrorHandler('Not authorized to access this challan', 403));
  }

  res.status(200).json({
    success: true,
    challan,
  });
});

// Update challan
export const updateChallan = catchAsyncError(async (req, res, next) => {
  let challan = await Challan.findById(req.params.id);

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  // Check if user has permission to update
  if (
    challan.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(new ErrorHandler('Not authorized to update this challan', 403));
  }

  // Don't allow updates if challan is delivered
  if (challan.status === 'delivered') {
    return next(new ErrorHandler('Cannot update a delivered challan', 400));
  }

  // Validate items if updating
  if (req.body.items) {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return next(new ErrorHandler('Please provide at least one item', 400));
    }

    req.body.items.forEach((item) => {
      if (!item.description || !item.quantity || !item.unit) {
        return next(new ErrorHandler('Please provide all item details', 400));
      }
      if (item.quantity <= 0) {
        return next(
          new ErrorHandler('Item quantity must be greater than 0', 400)
        );
      }
    });
  }

  challan = await Challan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails' },
  ]);

  res.status(200).json({
    success: true,
    challan,
  });
});

// Delete challan
export const deleteChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findById(req.params.id);

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  // Check if user has permission to delete
  if (
    challan.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(new ErrorHandler('Not authorized to delete this challan', 403));
  }

  // Don't allow deletion if challan is delivered
  if (challan.status === 'delivered') {
    return next(new ErrorHandler('Cannot delete a delivered challan', 400));
  }

  await challan.remove();

  res.status(200).json({
    success: true,
    message: 'Challan deleted successfully',
  });
});

// Update delivery status
export const updateDeliveryStatus = catchAsyncError(async (req, res, next) => {
  const { status, deliveryNotes } = req.body;
  const challan = await Challan.findById(req.params.id);

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  // Check if user has permission to update
  if (
    challan.createdBy.toString() !== req.user.id &&
    req.user.role !== ROLES.ADMIN
  ) {
    return next(new ErrorHandler('Not authorized to update this challan', 403));
  }

  // Validate status
  if (!['pending', 'delivered', 'cancelled'].includes(status)) {
    return next(new ErrorHandler('Invalid status', 400));
  }

  // Update challan
  challan.status = status;
  if (status === 'delivered') {
    challan.deliveredAt = Date.now();
  }
  if (deliveryNotes) {
    challan.deliveryNotes = deliveryNotes;
  }

  await challan.save();
  await challan.populate([
    { path: 'customer', select: 'name gstNo address' },
    { path: 'createdBy', select: 'name companyDetails' },
  ]);

  res.status(200).json({
    success: true,
    challan,
  });
});

// Get delivery statistics
export const getDeliveryStats = catchAsyncError(async (req, res, next) => {
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

  const stats = await Challan.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalChallans: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        avgDeliveryTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'delivered'] },
              {
                $divide: [
                  { $subtract: ['$deliveredAt', '$createdAt'] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
              null,
            ],
          },
        },
      },
    },
  ]);

  const monthlyStats = await Challan.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    stats: stats[0] || {
      totalChallans: 0,
      delivered: 0,
      pending: 0,
      cancelled: 0,
      avgDeliveryTime: 0,
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
