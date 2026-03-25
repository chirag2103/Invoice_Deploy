import Customer from '../models/Customer.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';

export const createCustomer = async (req, res, next) => {
  try {
    const { name, gstNo, address, openingBalance } = req.body;

    const existingCustomer = await Customer.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: 'Customer with this name already exists for the user.',
      });
    }

    const customer = await Customer.create({
      user: req.user.id,
      name: name.trim(),
      gstNo,
      address,
      openingBalance: Number(openingBalance || 0),
    });

    res.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ user: req.user.id })
      .collation({ locale: 'en', strength: 1 })
      .sort({ name: 1 })
      .lean();

    const { results, pagination } = filterAndPaginate(customers, req.query, [
      'name',
      'gstNo',
      'address',
      'openingBalance',
    ]);

    res.status(200).json({
      customers: results,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, gstNo, address, openingBalance } = req.body;

    const existingCustomer = await Customer.findOne({
      user: req.user.id,
      name: name.trim(),
      _id: { $ne: req.params.id },
    });

    if (existingCustomer) {
      return next(
        new ErrorHandler('Customer with this name already exists.', 400),
      );
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name: name.trim(),
        gstNo,
        address,
        openingBalance: Number(openingBalance || 0),
      },
      { new: true, runValidators: true },
    );

    if (!customer) {
      return next(new ErrorHandler('Customer not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return next(new ErrorHandler('Customer not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
