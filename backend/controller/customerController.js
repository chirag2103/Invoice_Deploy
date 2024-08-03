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
