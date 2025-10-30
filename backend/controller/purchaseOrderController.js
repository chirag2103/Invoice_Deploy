import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

export const createPO = catchAsyncError(async (req, res, next) => {
  const exists = await PurchaseOrder.find({
    poNo: req.body.poNo,
    user: req.user.id,
  });
  if (exists.length > 0) {
    return res.status(400).json({
      message: 'po with this Number already exists for the user.',
    });
  }
  const po = await PurchaseOrder.create({ ...req.body, user: req.user.id });
  res.status(201).json({ po });
});

export const getPO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.find({ user: req.user.id })
    .populate('seller')
    .sort({ poNo: -1 });
  res.status(200).json({ po });
});

export const getSinglePO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.find({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));
  res.status(200).json({ po });
});

export const updatePO = catchAsyncError(async (req, res, next) => {
  let po = await PurchaseOrder.find({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));
  po = await PurchaseOrder.findByIdAndUpdate(
    req.params.id,
    { ...req.body, user: req.user.id },
    {
      new: true,
    }
  );
  res.status(200).json({ po });
});

export const deletePO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return next(new ErrorHandler('PO not found', 404));
  await po.remove();
  res.status(200).json({ message: 'po deleted successfully' });
});

export const getLastPO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.findOne({ user: req.user.id }).sort({
    _id: -1,
  });
  res.status(200).json({ po });
});
