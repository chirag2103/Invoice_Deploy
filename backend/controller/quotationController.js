import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
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
  const {
    customer,
    gst,
    gstType,
    quotationProducts,
    invoiceDiscount,
    date,
    termsAndConditions,
    technicalSpecifications,
  } = req.body;

  if (
    !customer ||
    !date ||
    !Array.isArray(quotationProducts) ||
    quotationProducts.length === 0
  ) {
    return next(
      new ErrorHandler(
        'Customer, date and at least one product are required',
        400
      )
    );
  }

  const customerDoc = await Customer.findOne({
    _id: customer,
    user: req.user.id,
  });
  if (!customerDoc) {
    return next(new ErrorHandler('Customer not found', 404));
  }

  const products = pickProducts(quotationProducts);
  const totals = computeDocumentTotals({ products, invoiceDiscount, gst, gstType });

  const quotation = await createNumberedDocument({
    Model: Quotation,
    userId: req.user.id,
    documentType: 'quotation',
    dateInput: date,
    buildDoc: ({ numbering }) => ({
      user: req.user.id,
      customer,
      gst,
      gstType,
      quotationProducts: products,
      invoiceDiscount: totals.invoiceDiscount,
      invoiceTotal: totals.subTotal,
      grandTotal: totals.grandTotal,
      taxBreakup: totals.taxBreakup,
      date,
      termsAndConditions: termsAndConditions || '',
      technicalSpecifications: technicalSpecifications || '',
      quoteNo: numbering.quoteNo,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    }),
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
  const quotation = await Quotation.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

  const {
    customer,
    gst,
    gstType,
    quotationProducts,
    invoiceDiscount,
    date,
    termsAndConditions,
    technicalSpecifications,
  } = req.body;

  if (quotation.financialYearStart && date) {
    const nextFinancialYear = getFinancialYearInfo(date);
    if (nextFinancialYear.financialYearStart !== quotation.financialYearStart) {
      return next(
        new ErrorHandler(
          'Cannot move a numbered quotation to a different financial year. Create a new one instead.',
          409
        )
      );
    }
  }

  if (customer && String(customer) !== String(quotation.customer)) {
    const customerDoc = await Customer.findOne({
      _id: customer,
      user: req.user.id,
    });
    if (!customerDoc) {
      return next(new ErrorHandler('Customer not found', 404));
    }
    quotation.customer = customer;
  }

  if (Array.isArray(quotationProducts)) {
    quotation.quotationProducts = pickProducts(quotationProducts);
  }
  if (gst !== undefined) quotation.gst = gst;
  if (gstType !== undefined) quotation.gstType = gstType;
  if (invoiceDiscount !== undefined) quotation.invoiceDiscount = invoiceDiscount;
  if (date !== undefined) quotation.date = date;
  if (termsAndConditions !== undefined) {
    quotation.termsAndConditions = termsAndConditions;
  }
  if (technicalSpecifications !== undefined) {
    quotation.technicalSpecifications = technicalSpecifications;
  }

  const totals = computeDocumentTotals({
    products: quotation.quotationProducts,
    invoiceDiscount: quotation.invoiceDiscount,
    gst: quotation.gst,
    gstType: quotation.gstType,
  });
  quotation.invoiceDiscount = totals.invoiceDiscount;
  quotation.invoiceTotal = totals.subTotal;
  quotation.grandTotal = totals.grandTotal;
  quotation.taxBreakup = totals.taxBreakup;

  await quotation.save();

  res.status(200).json({ quotation });
});

export const deleteQuotation = catchAsyncError(async (req, res, next) => {
  const quotation = await Quotation.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!quotation) {
    return next(new ErrorHandler('Quotation not found', 404));
  }

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
