import Challan from '../models/Challan.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createChallan = catchAsyncError(async (req, res, next) => {
  // console.log(req.body);
  const challan = await Challan.create({ ...req.body, user: req.user.id });
  res.status(201).json({ challan });
});

export const getChallans = catchAsyncError(async (req, res, next) => {
  const challans = await Challan.find({ user: req.user.id })
    .populate('customer')
    .sort({ challanNo: -1 });
  res.status(200).json({ challans });
});

export const getSingleChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.find({
    _id: req.params.id,
    user: req.user.id,
  }).populate('customer');
  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }
  res.status(200).json({ challan });
});

export const updateChallan = catchAsyncError(async (req, res, next) => {
  let challan = await Challan.find({ _id: req.params.id, user: req.user.id });
  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  challan = await Challan.findByIdAndUpdate(
    req.params.id,
    { ...req.body, user: req.user.id },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ challan });
});

export const deleteChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findById(req.params.id);
  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  await challan.remove();
  res.status(200).json({ message: 'Challan deleted successfully' });
});

export const getLastChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findOne({ user: req.user.id }).sort({
    _id: -1,
  });
  res.status(200).json({ challan });
});
