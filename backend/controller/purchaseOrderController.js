import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { filterAndPaginate } from '../utils/listResponse.js';
import {
  buildFinancialYearFilter,
  getAvailableFinancialYearsFromDocuments,
  getFinancialYearInfo,
  getNextDocumentNumber,
  peekNextDocumentNumber,
} from '../utils/financialYear.js';

const sortPurchaseOrders = (purchaseOrders) =>
  [...purchaseOrders].sort((first, second) => {
    const secondFy = second.financialYearStart || 0;
    const firstFy = first.financialYearStart || 0;

    if (secondFy !== firstFy) {
      return secondFy - firstFy;
    }

    if ((second.poNo || 0) !== (first.poNo || 0)) {
      return (second.poNo || 0) - (first.poNo || 0);
    }

    return new Date(second.date) - new Date(first.date);
  });

export const createPO = catchAsyncError(async (req, res, next) => {
  const numbering = await getNextDocumentNumber(
    req.user.id,
    'purchaseOrder',
    req.body.date || new Date()
  );

  const po = await PurchaseOrder.create({
    ...req.body,
    user: req.user.id,
    poNo: numbering.quoteNo,
    sequenceNumber: numbering.sequenceNumber,
    financialYearStart: numbering.financialYearStart,
    financialYearLabel: numbering.financialYearLabel,
  });
  res.status(201).json({ po });
});

export const getPO = catchAsyncError(async (req, res, next) => {
  const availableYearsSource = await PurchaseOrder.find({ user: req.user.id })
    .select('date financialYearLabel financialYearStart')
    .lean();
  const allPo = await PurchaseOrder.find({
    user: req.user.id,
    ...buildFinancialYearFilter(req.query, 'date'),
  })
    .populate('seller')
    .lean();
  const sortedPurchaseOrders = sortPurchaseOrders(allPo);
  const { results, pagination } = filterAndPaginate(
    sortedPurchaseOrders,
    req.query,
    [
    'poNo',
    'financialYearLabel',
    'seller.name',
    'date',
    ]
  );
  res.status(200).json({
    po: results,
    pagination,
    availableFinancialYears: getAvailableFinancialYearsFromDocuments(
      availableYearsSource,
      'date'
    ),
    currentFinancialYear: getFinancialYearInfo().financialYearLabel,
  });
});

export const getSinglePO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate('seller');
  if (!po) return next(new ErrorHandler('PO not found', 404));
  res.status(200).json({ po });
});

export const updatePO = catchAsyncError(async (req, res, next) => {
  let po = await PurchaseOrder.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));

  const updatePayload = { ...req.body, user: req.user.id };

  if (po.financialYearStart) {
    const nextFinancialYear = getFinancialYearInfo(req.body.date || po.date);

    if (nextFinancialYear.financialYearStart !== po.financialYearStart) {
      const numbering = await getNextDocumentNumber(
        req.user.id,
        'purchaseOrder',
        req.body.date || po.date
      );

      updatePayload.poNo = numbering.quoteNo;
      updatePayload.sequenceNumber = numbering.sequenceNumber;
      updatePayload.financialYearStart = numbering.financialYearStart;
      updatePayload.financialYearLabel = numbering.financialYearLabel;
    }
  }

  po = await PurchaseOrder.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ po });
});

export const deletePO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));
  await po.remove();
  res.status(200).json({ message: 'po deleted successfully' });
});

export const getLastPO = catchAsyncError(async (req, res, next) => {
  const { nextNumber, financialYearLabel, financialYearStart } =
    await peekNextDocumentNumber(
      req.user.id,
      'purchaseOrder',
      req.query.date || new Date()
    );

  res.status(200).json({
    po: {
      poNo: nextNumber,
      sequenceNumber: nextNumber,
      financialYearLabel,
      financialYearStart,
    },
  });
});
