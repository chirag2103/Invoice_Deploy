import Seller from '../models/Seller.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';

export const createSeller = async (req, res, next) => {
  try {
    const { name, gstNo, address, contact, openingBalance } = req.body;

    const exists = await Seller.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        message: 'Seller with this name already exists for the user.',
      });
    }

    const seller = await Seller.create({
      user: req.user.id,
      name: name.trim(),
      gstNumber: gstNo || '',
      address,
      contact,
      openingBalance: Number(openingBalance || 0),
    });

    res.status(201).json({ seller });
  } catch (error) {
    next(error);
  }
};

export const getSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find({ user: req.user.id })
      .collation({ locale: 'en', strength: 1 })
      .sort({ name: 1 })
      .lean({ virtuals: true });

    const normalizedSellers = sellers.map((seller) => ({
      ...seller,
      gstNo: seller.gstNumber || seller.gstNo || '',
    }));

    const { results, pagination } = filterAndPaginate(
      normalizedSellers,
      req.query,
      ['name', 'gstNo', 'address', 'contact', 'openingBalance'],
    );

    res.status(200).json({
      sellers: results,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSeller = async (req, res, next) => {
  try {
    const { name, gstNo, address, contact, openingBalance } = req.body;

    const exists = await Seller.findOne({
      user: req.user.id,
      name: name.trim(),
      _id: { $ne: req.params.id },
    });

    if (exists) {
      return next(new ErrorHandler('Seller with this name already exists.', 400));
    }

    const seller = await Seller.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name: name.trim(),
        gstNumber: gstNo || '',
        address,
        contact,
        openingBalance: Number(openingBalance || 0),
      },
      { new: true, runValidators: true },
    );

    if (!seller) {
      return next(new ErrorHandler('Seller not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Seller updated successfully',
      seller,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!seller) {
      return next(new ErrorHandler('Seller not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
