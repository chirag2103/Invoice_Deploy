import catchAsyncError from '../middlewares/catchAsyncError.js';
import Customer from '../models/Customer.js';

export const createCustomer = async (req, res, next) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({
    customer,
  });
};
export const getCustomers = async (req, res, next) => {
  const customers = await Customer.find();
  // console.log(customers);
  res.status(200).json({
    customers,
  });
};
export const getSingleCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.status(200).json({
      customer,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching Customer', 500));
  }
});
