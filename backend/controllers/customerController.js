import catchAsyncError from '../middlewares/catchAsyncError.js';
import Customer from '../models/Customer.js';
import ErrorHandler from '../utils/errorHandler.js';

// Create a new customer
export const createCustomer = catchAsyncError(async (req, res, next) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({
    success: true,
    customer,
  });
});

// Get all customers
export const getCustomers = catchAsyncError(async (req, res, next) => {
  const customers = await Customer.find();
  res.status(200).json({
    success: true,
    customers,
  });
});

// Get single customer
export const getSingleCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(new ErrorHandler('Customer not found', 404));
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching Customer', 500));
  }
});
