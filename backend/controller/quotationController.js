import Quotation from '../models/Quotation.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createQuotation = catchAsyncError(async (req, res, next) => {
  const exists = await Quotation.find({
    quoteNo: req.body.quoteNo,
    user: req.user.id,
  });
  if (exists) {
    return res.status(400).json({
      message: 'Quotationn with this Number already exists for the user.',
    });
  }
  const quotation = await Quotation.create({ ...req.body, user: req.user.id });
  res.status(201).json({ quotation });
});

export const getQuotations = catchAsyncError(async (req, res, next) => {
  const quotations = await Quotation.find({ user: req.user.id })
    .populate('customer')
    .sort({ quoteNo: -1 });
  res.status(200).json({ quotations });
});

export const getSingleQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.find({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!quotation) return next(new ErrorHandler('Quotation not found', 404));
  res.status(200).json({ quotation });
});

export const updateQuotation = catchAsyncError(async (req, res, next) => {
  let quotation = await Quotation.find({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!quotation) return next(new ErrorHandler('Quotation not found', 404));
  quotation = await Quotation.findByIdAndUpdate(
    req.params.id,
    { ...req.body, user: req.user.id },
    {
      new: true,
    }
  );
  res.status(200).json({ quotation });
});

export const deleteQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) return next(new ErrorHandler('Quotation not found', 404));
  await quotation.remove();
  res.status(200).json({ message: 'Quotation deleted successfully' });
});

export const getLastQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findOne({ user: req.user.id }).sort({
    _id: -1,
  });
  res.status(200).json({ quotation });
});
