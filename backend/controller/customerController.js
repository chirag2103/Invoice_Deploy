import Customer from '../models/Customer.js';

export const createCustomer = async (req, res, next) => {
  try {
    const { name, gstNo, address } = req.body;

    // Check if customer with same user and name exists
    const existingCustomer = await Customer.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: 'Customer with this name already exists for the user.',
      });
    }

    // Create new customer
    const customer = await Customer.create({
      user: req.user.id,
      name: name.trim(),
      gstNo,
      address,
    });

    res.status(201).json({
      customer,
    });
  } catch (error) {
    next(error);
  }
};
export const getCustomers = async (req, res, next) => {
  const customers = await Customer.find({ user: req.user.id })
    .collation({ locale: 'en', strength: 1 })
    .sort({
      name: 1,
    });
  // console.log(customers);
  res.status(200).json({
    customers,
  });
};
