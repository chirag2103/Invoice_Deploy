import Customer from '../models/Customer.js';
import ErrorHandler from '../utils/errorHandler.js';
import paginateQuery from '../utils/paginateQuery.js';

const CUSTOMER_SEARCH_FIELDS = [
  'name',
  'gstNo',
  'address',
  { field: 'openingBalance', type: 'number' },
];
const CUSTOMER_ALLOWED_SORT = {
  name: { name: 1 },
  '-name': { name: -1 },
  balance: { openingBalance: -1 },
  '-balance': { openingBalance: 1 },
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, gstNo, address, openingBalance } = req.body;

    if (!name || !String(name).trim()) {
      return next(new ErrorHandler('Customer name is required', 400));
    }

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
    const { data, pagination } = await paginateQuery(Customer, {
      filter: { user: req.user.id },
      query: req.query,
      searchFields: CUSTOMER_SEARCH_FIELDS,
      allowedSort: CUSTOMER_ALLOWED_SORT,
      defaultSort: { name: 1 },
      // Some pages (e.g. the payment form's customer picker) load a large
      // batch at once rather than paging through a dropdown.
      maxLimit: 500,
      collation: { locale: 'en', strength: 1 },
    });

    res.status(200).json({
      customers: data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, gstNo, address, openingBalance } = req.body;

    if (!name || !String(name).trim()) {
      return next(new ErrorHandler('Customer name is required', 400));
    }

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
