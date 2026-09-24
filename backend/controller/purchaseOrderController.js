import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Seller from '../models/Seller.js';
import { filterAndPaginate } from '../utils/listResponse.js';
import { pickProducts } from '../utils/pickProduct.js';
import computeDocumentTotals from '../services/documentTotals.js';
import createNumberedDocument from '../services/createNumberedDocument.js';
import {
  buildFinancialYearFilter,
  getAvailableFinancialYearsFromDocuments,
  getFinancialYearInfo,
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
  const {
    seller,
    gst,
    gstType,
    poProducts,
    invoiceDiscount,
    date,
    termsAndConditions,
    technicalSpecifications,
  } = req.body;

  if (
    !seller ||
    !date ||
    !Array.isArray(poProducts) ||
    poProducts.length === 0
  ) {
    return next(
      new ErrorHandler(
        'Seller, date and at least one product are required',
        400
      )
    );
  }

  const sellerDoc = await Seller.findOne({ _id: seller, user: req.user.id });
  if (!sellerDoc) {
    return next(new ErrorHandler('Seller not found', 404));
  }

  const products = pickProducts(poProducts);
  const totals = computeDocumentTotals({ products, invoiceDiscount, gst, gstType });

  const po = await createNumberedDocument({
    Model: PurchaseOrder,
    userId: req.user.id,
    documentType: 'purchaseOrder',
    dateInput: date,
    buildDoc: ({ numbering }) => ({
      user: req.user.id,
      seller,
      gst,
      gstType,
      poProducts: products,
      invoiceDiscount: totals.invoiceDiscount,
      invoiceTotal: totals.subTotal,
      grandTotal: totals.grandTotal,
      taxBreakup: totals.taxBreakup,
      date,
      termsAndConditions: termsAndConditions || '',
      technicalSpecifications: technicalSpecifications || '',
      poNo: numbering.quoteNo,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    }),
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
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));

  const {
    seller,
    gst,
    gstType,
    poProducts,
    invoiceDiscount,
    date,
    termsAndConditions,
    technicalSpecifications,
  } = req.body;

  if (po.financialYearStart && date) {
    const nextFinancialYear = getFinancialYearInfo(date);
    if (nextFinancialYear.financialYearStart !== po.financialYearStart) {
      return next(
        new ErrorHandler(
          'Cannot move a numbered purchase order to a different financial year. Create a new one instead.',
          409
        )
      );
    }
  }

  if (seller && String(seller) !== String(po.seller)) {
    const sellerDoc = await Seller.findOne({ _id: seller, user: req.user.id });
    if (!sellerDoc) {
      return next(new ErrorHandler('Seller not found', 404));
    }
    po.seller = seller;
  }

  if (Array.isArray(poProducts)) po.poProducts = pickProducts(poProducts);
  if (gst !== undefined) po.gst = gst;
  if (gstType !== undefined) po.gstType = gstType;
  if (invoiceDiscount !== undefined) po.invoiceDiscount = invoiceDiscount;
  if (date !== undefined) po.date = date;
  if (termsAndConditions !== undefined) {
    po.termsAndConditions = termsAndConditions;
  }
  if (technicalSpecifications !== undefined) {
    po.technicalSpecifications = technicalSpecifications;
  }

  const totals = computeDocumentTotals({
    products: po.poProducts,
    invoiceDiscount: po.invoiceDiscount,
    gst: po.gst,
    gstType: po.gstType,
  });
  po.invoiceDiscount = totals.invoiceDiscount;
  po.invoiceTotal = totals.subTotal;
  po.grandTotal = totals.grandTotal;
  po.taxBreakup = totals.taxBreakup;

  await po.save();
  res.status(200).json({ po });
});

export const deletePO = catchAsyncError(async (req, res, next) => {
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!po) return next(new ErrorHandler('PO not found', 404));
  await PurchaseOrder.deleteOne({ _id: po._id, user: req.user.id });
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
