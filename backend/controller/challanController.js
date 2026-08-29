import Challan from '../models/Challan.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';
import {
  buildFinancialYearFilter,
  getAvailableFinancialYearsFromDocuments,
  getFinancialYearInfo,
  getNextDocumentNumber,
  peekNextDocumentNumber,
} from '../utils/financialYear.js';

const sortChallans = (challans) =>
  [...challans].sort((first, second) => {
    const secondFy = second.financialYearStart || 0;
    const firstFy = first.financialYearStart || 0;

    if (secondFy !== firstFy) {
      return secondFy - firstFy;
    }

    if ((second.challanNo || 0) !== (first.challanNo || 0)) {
      return (second.challanNo || 0) - (first.challanNo || 0);
    }

    return new Date(second.challanDate) - new Date(first.challanDate);
  });

export const createChallan = catchAsyncError(async (req, res, next) => {
  const numbering = await getNextDocumentNumber(
    req.user.id,
    'challan',
    req.body.challanDate || new Date()
  );

  const challan = await Challan.create({
    ...req.body,
    user: req.user.id,
    challanNo: numbering.challanNo,
    sequenceNumber: numbering.sequenceNumber,
    financialYearStart: numbering.financialYearStart,
    financialYearLabel: numbering.financialYearLabel,
  });

  res.status(201).json({ challan });
});

export const getChallans = catchAsyncError(async (req, res, next) => {
  const availableYearsSource = await Challan.find({ user: req.user.id })
    .select('challanDate financialYearLabel financialYearStart')
    .lean();
  const allChallans = await Challan.find({
    user: req.user.id,
    ...buildFinancialYearFilter(req.query, 'challanDate'),
  })
    .populate('customer')
    .lean();

  const sortedChallans = sortChallans(allChallans);
  const { results, pagination } = filterAndPaginate(sortedChallans, req.query, [
    'challanNo',
    'financialYearLabel',
    'customer.name',
    'challanDate',
  ]);

  res.status(200).json({
    challans: results,
    pagination,
    availableFinancialYears: getAvailableFinancialYearsFromDocuments(
      availableYearsSource,
      'challanDate'
    ),
    currentFinancialYear: getFinancialYearInfo().financialYearLabel,
  });
});

export const getSingleChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate('customer');

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  res.status(200).json({ challan });
});

export const updateChallan = catchAsyncError(async (req, res, next) => {
  let challan = await Challan.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  const updatePayload = { ...req.body, user: req.user.id };

  if (challan.financialYearStart) {
    const nextFinancialYear = getFinancialYearInfo(
      req.body.challanDate || challan.challanDate
    );

    if (nextFinancialYear.financialYearStart !== challan.financialYearStart) {
      const numbering = await getNextDocumentNumber(
        req.user.id,
        'challan',
        req.body.challanDate || challan.challanDate
      );

      updatePayload.challanNo = numbering.challanNo;
      updatePayload.sequenceNumber = numbering.sequenceNumber;
      updatePayload.financialYearStart = numbering.financialYearStart;
      updatePayload.financialYearLabel = numbering.financialYearLabel;
    }
  }

  challan = await Challan.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ challan });
});

export const deleteChallan = catchAsyncError(async (req, res, next) => {
  const challan = await Challan.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  res.status(200).json({ message: 'Challan deleted successfully' });
});

export const getLastChallan = catchAsyncError(async (req, res, next) => {
  const { nextNumber, financialYearLabel, financialYearStart } =
    await peekNextDocumentNumber(
      req.user.id,
      'challan',
      req.query.date || new Date()
    );

  res.status(200).json({
    challan: {
      challanNo: nextNumber,
      sequenceNumber: nextNumber,
      financialYearLabel,
      financialYearStart,
    },
  });
});
