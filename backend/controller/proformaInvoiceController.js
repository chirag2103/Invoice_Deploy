import ProformaInvoice from '../models/ProformaInvoice.js';
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

const sortProformaInvoices = (proformas) =>
  [...proformas].sort((first, second) => {
    const secondFy = second.financialYearStart || 0;
    const firstFy = first.financialYearStart || 0;

    if (secondFy !== firstFy) {
      return secondFy - firstFy;
    }

    if ((second.proformaNo || 0) !== (first.proformaNo || 0)) {
      return (second.proformaNo || 0) - (first.proformaNo || 0);
    }

    return new Date(second.date) - new Date(first.date);
  });

export const getLastProformaInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const { nextNumber, financialYearLabel, financialYearStart } =
      await peekNextDocumentNumber(
        req.user.id,
        'proforma',
        req.query.date || new Date()
      );

    res.status(200).json({
      proforma: {
        proformaNo: nextNumber,
        sequenceNumber: nextNumber,
        financialYearLabel,
        financialYearStart,
      },
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching last proforma invoice', 500));
  }
});

export const createProformaInvoice = catchAsyncError(async (req, res, next) => {
  const {
    customer,
    gst,
    gstType,
    proformaProducts,
    invoiceDiscount,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    validUntil,
    termsAndConditions,
    shipTo,
  } = req.body;

  if (
    !customer ||
    !date ||
    !Array.isArray(proformaProducts) ||
    proformaProducts.length === 0
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

  const products = pickProducts(proformaProducts);
  const totals = computeDocumentTotals({ products, invoiceDiscount, gst, gstType });

  const proforma = await createNumberedDocument({
    Model: ProformaInvoice,
    userId: req.user.id,
    documentType: 'proforma',
    dateInput: date,
    buildDoc: ({ numbering }) => ({
      user: req.user.id,
      customer,
      shipTo: shipTo || undefined,
      gst,
      gstType,
      proformaProducts: products,
      invoiceDiscount: totals.invoiceDiscount,
      invoiceTotal: totals.subTotal,
      grandTotal: totals.grandTotal,
      taxBreakup: totals.taxBreakup,
      date,
      challanNo,
      challanDate,
      orderNo,
      orderDate,
      validUntil,
      termsAndConditions: termsAndConditions || '',
      proformaNo: numbering.sequenceNumber,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    }),
  });

  res.status(201).json({ proforma });
});

export const getProformaInvoices = catchAsyncError(async (req, res, next) => {
  try {
    const availableYearsSource = await ProformaInvoice.find({ user: req.user.id })
      .select('date financialYearLabel financialYearStart')
      .lean();
    const allProformas = await ProformaInvoice.find({
      user: req.user.id,
      ...buildFinancialYearFilter(req.query, 'date'),
    })
      .populate('customer')
      .lean();

    const sortedProformas = sortProformaInvoices(allProformas);
    const { results, pagination } = filterAndPaginate(sortedProformas, req.query, [
      'proformaNo',
      'financialYearLabel',
      'customer.name',
      'grandTotal',
      'date',
    ]);

    res.status(200).json({
      proformas: results,
      pagination,
      availableFinancialYears: getAvailableFinancialYearsFromDocuments(
        availableYearsSource,
        'date'
      ),
      currentFinancialYear: getFinancialYearInfo().financialYearLabel,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching proforma invoices', 500));
  }
});

export const getSingleProformaInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const proforma = await ProformaInvoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!proforma) {
      return next(new ErrorHandler('Proforma invoice not found', 404));
    }
    res.status(200).json({ proforma });
  } catch (error) {
    next(new ErrorHandler('Error fetching proforma invoice', 500));
  }
});

export const updateProformaInvoice = catchAsyncError(async (req, res, next) => {
  const proforma = await ProformaInvoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!proforma) {
    return next(new ErrorHandler('Proforma invoice not found', 404));
  }

  const {
    customer,
    gst,
    gstType,
    proformaProducts,
    invoiceDiscount,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    validUntil,
    termsAndConditions,
    shipTo,
  } = req.body;

  if (proforma.financialYearStart && date) {
    const nextFinancialYear = getFinancialYearInfo(date);
    if (nextFinancialYear.financialYearStart !== proforma.financialYearStart) {
      return next(
        new ErrorHandler(
          'Cannot move a numbered proforma to a different financial year. Create a new one instead.',
          409
        )
      );
    }
  }

  if (customer && String(customer) !== String(proforma.customer)) {
    const customerDoc = await Customer.findOne({
      _id: customer,
      user: req.user.id,
    });
    if (!customerDoc) {
      return next(new ErrorHandler('Customer not found', 404));
    }
    proforma.customer = customer;
  }

  if (Array.isArray(proformaProducts)) {
    proforma.proformaProducts = pickProducts(proformaProducts);
  }
  if (gst !== undefined) proforma.gst = gst;
  if (gstType !== undefined) proforma.gstType = gstType;
  if (invoiceDiscount !== undefined) proforma.invoiceDiscount = invoiceDiscount;
  if (date !== undefined) proforma.date = date;
  if (challanNo !== undefined) proforma.challanNo = challanNo;
  if (challanDate !== undefined) proforma.challanDate = challanDate;
  if (orderNo !== undefined) proforma.orderNo = orderNo;
  if (orderDate !== undefined) proforma.orderDate = orderDate;
  if (validUntil !== undefined) proforma.validUntil = validUntil;
  if (termsAndConditions !== undefined) {
    proforma.termsAndConditions = termsAndConditions;
  }
  if (shipTo !== undefined) proforma.shipTo = shipTo || undefined;

  const totals = computeDocumentTotals({
    products: proforma.proformaProducts,
    invoiceDiscount: proforma.invoiceDiscount,
    gst: proforma.gst,
    gstType: proforma.gstType,
  });
  proforma.invoiceDiscount = totals.invoiceDiscount;
  proforma.invoiceTotal = totals.subTotal;
  proforma.grandTotal = totals.grandTotal;
  proforma.taxBreakup = totals.taxBreakup;

  await proforma.save();

  res.status(200).json({ success: true, proforma });
});

export const deleteProformaInvoice = catchAsyncError(async (req, res, next) => {
  const proforma = await ProformaInvoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!proforma) {
    return next(new ErrorHandler('Proforma invoice not found', 404));
  }

  await ProformaInvoice.deleteOne({ _id: proforma._id, user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Proforma Invoice Deleted',
  });
});
