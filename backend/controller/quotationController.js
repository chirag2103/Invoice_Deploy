import Quotation from '../models/Quotation.js';
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

const sortQuotations = (quotations) =>
  [...quotations].sort((first, second) => {
    const secondFy = second.financialYearStart || 0;
    const firstFy = first.financialYearStart || 0;

    if (secondFy !== firstFy) {
      return secondFy - firstFy;
    }

    if ((second.quoteNo || 0) !== (first.quoteNo || 0)) {
      return (second.quoteNo || 0) - (first.quoteNo || 0);
    }

    return new Date(second.date) - new Date(first.date);
  });

export const createQuotation = catchAsyncError(async (req, res, next) => {
  const numbering = await getNextDocumentNumber(
    req.user.id,
    'quotation',
    req.body.date || new Date()
  );

  const quotation = await Quotation.create({
    ...req.body,
    user: req.user.id,
    quoteNo: numbering.quoteNo,
    sequenceNumber: numbering.sequenceNumber,
    financialYearStart: numbering.financialYearStart,
    financialYearLabel: numbering.financialYearLabel,
  });

  res.status(201).json({ quotation });
});

export const getQuotations = catchAsyncError(async (req, res, next) => {
  const availableYearsSource = await Quotation.find({ user: req.user.id })
    .select('date financialYearLabel financialYearStart')
    .lean();
  const allQuotations = await Quotation.find({
    user: req.user.id,
    ...buildFinancialYearFilter(req.query, 'date'),
  })
    .populate('customer')
    .lean();

  const sortedQuotations = sortQuotations(allQuotations);
  const { results, pagination } = filterAndPaginate(
    sortedQuotations,
    req.query,
    ['quoteNo', 'financialYearLabel', 'customer.name', 'date']
  );

  res.status(200).json({
    quotations: results,
    pagination,
    availableFinancialYears: getAvailableFinancialYearsFromDocuments(
      availableYearsSource,
      'date'
    ),
    currentFinancialYear: getFinancialYearInfo().financialYearLabel,
  });
});

export const getSingleQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  res.status(200).json({ quotation });
});

export const updateQuotation = catchAsyncError(async (req, res, next) => {
  let quotation = await Quotation.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  const updatePayload = { ...req.body, user: req.user.id };

  if (quotation.financialYearStart) {
    const nextFinancialYear = getFinancialYearInfo(req.body.date || quotation.date);

    if (nextFinancialYear.financialYearStart !== quotation.financialYearStart) {
      const numbering = await getNextDocumentNumber(
        req.user.id,
        'quotation',
        req.body.date || quotation.date
      );

      updatePayload.quoteNo = numbering.quoteNo;
      updatePayload.sequenceNumber = numbering.sequenceNumber;
      updatePayload.financialYearStart = numbering.financialYearStart;
      updatePayload.financialYearLabel = numbering.financialYearLabel;
    }
  }

  quotation = await Quotation.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
  });

  res.status(200).json({ quotation });
});

export const deleteQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  await quotation.remove();
  res.status(200).json({ message: 'Quotation deleted successfully' });
});

export const getLastQuotation = catchAsyncError(async (req, res, next) => {
  const { nextNumber, financialYearLabel, financialYearStart } =
    await peekNextDocumentNumber(
      req.user.id,
      'quotation',
      req.query.date || new Date()
    );

  res.status(200).json({
    quotation: {
      quoteNo: nextNumber,
      sequenceNumber: nextNumber,
      financialYearLabel,
      financialYearStart,
    },
  });
});
