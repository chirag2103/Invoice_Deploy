import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
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

const parseQueryDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(
    endOfDay ? `${value}T23:59:59.999` : `${value}T00:00:00.000`
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortInvoices = (invoices) =>
  [...invoices].sort((first, second) => {
    const secondFy = second.financialYearStart || 0;
    const firstFy = first.financialYearStart || 0;

    if (secondFy !== firstFy) {
      return secondFy - firstFy;
    }

    if ((second.invoiceNo || 0) !== (first.invoiceNo || 0)) {
      return (second.invoiceNo || 0) - (first.invoiceNo || 0);
    }

    return new Date(second.date) - new Date(first.date);
  });

export const getLastInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const { nextNumber, financialYearLabel, financialYearStart } =
      await peekNextDocumentNumber(
        req.user.id,
        'invoice',
        req.query.date || new Date()
      );

    res.status(200).json({
      invoice: {
        invoiceNo: nextNumber,
        sequenceNumber: nextNumber,
        financialYearLabel,
        financialYearStart,
      },
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching last invoice', 500));
  }
});

export const createInvoice = catchAsyncError(async (req, res, next) => {
  const {
    customer,
    gst,
    gstType,
    invoiceProducts,
    invoiceDiscount,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    termsAndConditions,
    shipTo,
  } = req.body;

  if (
    !customer ||
    !date ||
    !Array.isArray(invoiceProducts) ||
    invoiceProducts.length === 0
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

  const products = pickProducts(invoiceProducts);
  const totals = computeDocumentTotals({ products, invoiceDiscount, gst, gstType });

  const invoice = await createNumberedDocument({
    Model: Invoice,
    userId: req.user.id,
    documentType: 'invoice',
    dateInput: date,
    buildDoc: ({ numbering }) => ({
      user: req.user.id,
      customer,
      shipTo: shipTo || undefined,
      gst,
      gstType,
      invoiceProducts: products,
      invoiceDiscount: totals.invoiceDiscount,
      invoiceTotal: totals.subTotal,
      grandTotal: totals.grandTotal,
      taxBreakup: totals.taxBreakup,
      date,
      challanNo,
      challanDate,
      orderNo,
      orderDate,
      termsAndConditions: termsAndConditions || '',
      invoiceNo: numbering.invoiceNo,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    }),
  });

  res.status(201).json({ invoice });
});

export const getInvoices = catchAsyncError(async (req, res, next) => {
  try {
    const availableYearsSource = await Invoice.find({ user: req.user.id })
      .select('date financialYearLabel financialYearStart')
      .lean();
    const allInvoices = await Invoice.find({
      user: req.user.id,
      ...buildFinancialYearFilter(req.query, 'date'),
    })
      .populate('customer')
      .lean();

    const sortedInvoices = sortInvoices(allInvoices);
    const { results, pagination } = filterAndPaginate(sortedInvoices, req.query, [
      'invoiceNo',
      'financialYearLabel',
      'customer.name',
      'grandTotal',
      'date',
    ]);

    res.status(200).json({
      invoices: results,
      pagination,
      availableFinancialYears: getAvailableFinancialYearsFromDocuments(
        availableYearsSource,
        'date'
      ),
      currentFinancialYear: getFinancialYearInfo().financialYearLabel,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoices', 500));
  }
});

export const getSingleInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    res.status(200).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoice', 500));
  }
});

export const getInvoicesByCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(new ErrorHandler('Invalid customer ID', 400));
    }

    const availableYearsSource = await Invoice.find({
      customer: customerId,
      user: req.user.id,
    })
      .select('date financialYearLabel financialYearStart')
      .lean();

    const allInvoices = await Invoice.find({
      customer: customerId,
      user: req.user.id,
      ...buildFinancialYearFilter(req.query, 'date'),
    })
      .populate('customer')
      .lean();

    const customer = await Customer.findById(customerId);
    const customerName = customer?.name || '';

    const total = allInvoices.reduce(
      (runningTotal, invoice) => runningTotal + (invoice.grandTotal || 0),
      0
    );

    const sortedInvoices = sortInvoices(allInvoices);
    const { results, pagination } = filterAndPaginate(sortedInvoices, req.query, [
      'invoiceNo',
      'financialYearLabel',
      'customer.name',
      'grandTotal',
      'date',
    ]);

    res.status(200).json({
      invoices: results,
      total,
      customerName,
      pagination,
      availableFinancialYears: getAvailableFinancialYearsFromDocuments(
        availableYearsSource,
        'date'
      ),
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoices for the customer', 500));
  }
});

export const updateInvoice = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!invoice) {
    return next(new ErrorHandler('Invoice not found', 404));
  }

  const {
    customer,
    gst,
    gstType,
    invoiceProducts,
    invoiceDiscount,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    termsAndConditions,
    shipTo,
  } = req.body;

  // A numbered invoice must stay in its financial year — the serial number is
  // tied to that year. Re-issue via a credit note instead of moving it.
  if (invoice.financialYearStart && date) {
    const nextFinancialYear = getFinancialYearInfo(date);
    if (nextFinancialYear.financialYearStart !== invoice.financialYearStart) {
      return next(
        new ErrorHandler(
          'Cannot move a numbered invoice to a different financial year. Cancel and re-issue it instead.',
          409
        )
      );
    }
  }

  if (customer && String(customer) !== String(invoice.customer)) {
    const customerDoc = await Customer.findOne({
      _id: customer,
      user: req.user.id,
    });
    if (!customerDoc) {
      return next(new ErrorHandler('Customer not found', 404));
    }
    invoice.customer = customer;
  }

  if (Array.isArray(invoiceProducts)) {
    invoice.invoiceProducts = pickProducts(invoiceProducts);
  }
  if (gst !== undefined) invoice.gst = gst;
  if (gstType !== undefined) invoice.gstType = gstType;
  if (invoiceDiscount !== undefined) invoice.invoiceDiscount = invoiceDiscount;
  if (date !== undefined) invoice.date = date;
  if (challanNo !== undefined) invoice.challanNo = challanNo;
  if (challanDate !== undefined) invoice.challanDate = challanDate;
  if (orderNo !== undefined) invoice.orderNo = orderNo;
  if (orderDate !== undefined) invoice.orderDate = orderDate;
  if (termsAndConditions !== undefined) {
    invoice.termsAndConditions = termsAndConditions;
  }
  if (shipTo !== undefined) invoice.shipTo = shipTo || undefined;

  const totals = computeDocumentTotals({
    products: invoice.invoiceProducts,
    invoiceDiscount: invoice.invoiceDiscount,
    gst: invoice.gst,
    gstType: invoice.gstType,
  });
  invoice.invoiceDiscount = totals.invoiceDiscount;
  invoice.invoiceTotal = totals.subTotal;
  invoice.grandTotal = totals.grandTotal;
  invoice.taxBreakup = totals.taxBreakup;

  await invoice.save();

  res.status(200).json({ success: true, invoice });
});

export const deleteInvoice = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!invoice) {
    return next(new ErrorHandler('Invoice not found', 404));
  }

  await Invoice.deleteOne({ _id: invoice._id, user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Invoice Deleted',
  });
});

export const getCustomerBillingInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;

    const invoiceAgg = await Invoice.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$customer',
          totalBill: { $sum: '$grandTotal' },
        },
      },
    ]);

    const paymentAgg = await Payment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$customer',
          totalPaid: { $sum: '$amountPaid' },
        },
      },
    ]);

    const customers = await Customer.find({ user: userId }).select(
      'name openingBalance'
    );

    const invoiceMap = new Map(
      invoiceAgg.map((invoiceGroup) => [
        invoiceGroup._id.toString(),
        invoiceGroup.totalBill,
      ])
    );

    const paymentMap = new Map(
      paymentAgg.map((paymentGroup) => [
        paymentGroup._id.toString(),
        paymentGroup.totalPaid,
      ])
    );

    const result = customers
      .map((customer) => {
        const customerId = customer._id.toString();
        const totalBill = invoiceMap.get(customerId) || 0;
        const totalPaid = paymentMap.get(customerId) || 0;

        if (totalBill === 0 && totalPaid === 0) {
          return null;
        }

        return {
          customerName: customer.name,
          totalBill,
          totalPaid,
          remainingAmount:
            (customer.openingBalance || 0) + totalBill - totalPaid,
        };
      })
      .filter(Boolean)
      .sort((first, second) =>
        first.customerName
          .toLowerCase()
          .localeCompare(second.customerName.toLowerCase())
      );

    const { results, pagination } = filterAndPaginate(result, req.query, [
      'customerName',
      'totalBill',
      'totalPaid',
      'remainingAmount',
    ]);

    res.status(200).json({
      success: true,
      data: results,
      pagination,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching customer billing info', 500));
  }
});

export const getStatementByCustomer = catchAsyncError(async (req, res, next) => {
  const customerId = req.params.id;

  try {
    const customer = await Customer.findOne({
      _id: customerId,
      user: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { from, to } = req.query;
    const fromDate = parseQueryDate(from);
    const toDate = parseQueryDate(to, true);

    const invoices = await Invoice.find({
      user: req.user.id,
      customer: customerId,
    }).sort({ date: 1 });

    const payments = await Payment.find({
      user: req.user.id,
      customer: customerId,
    }).sort({ date: 1 });

    const statement = [];
    let totalPaid = 0;
    let totalInvoice = 0;
    let currentBalance = 0;
    let openingBalance = Number(customer.openingBalance || 0);

    const allEntries = [
      ...invoices.map((invoice) => ({
        date: invoice.date,
        type: 'invoice',
        detail: invoice.financialYearLabel
          ? `${invoice.financialYearLabel}/${invoice.invoiceNo}`
          : invoice.invoiceNo,
        invoiceAmount: invoice.grandTotal,
        paymentAmount: null,
      })),
      ...payments.map((payment) => ({
        date: payment.date,
        type: 'payment',
        detail: 'Payment',
        invoiceAmount: null,
        paymentAmount: payment.amountPaid,
      })),
    ].map((entry) => ({
      ...entry,
      timestamp: new Date(entry.date),
    }));

    allEntries.sort((first, second) => first.timestamp - second.timestamp);

    if (fromDate) {
      const preRangeEntries = allEntries.filter((entry) => entry.timestamp < fromDate);
      preRangeEntries.forEach((entry) => {
        if (entry.type === 'invoice') {
          openingBalance += Number(entry.invoiceAmount || 0);
        } else {
          openingBalance -= Number(entry.paymentAmount || 0);
        }
      });
    }

    if (openingBalance !== 0) {
      currentBalance = openingBalance;
      statement.push({
        date: fromDate || customer.createdAt || new Date('2024-01-01'),
        type: 'opening',
        detail: fromDate ? `Opening Balance (as of ${from})` : 'Opening Balance',
        invoiceAmount: openingBalance > 0 ? openingBalance : null,
        paymentAmount: openingBalance < 0 ? Math.abs(openingBalance) : null,
        balance: currentBalance,
      });
    }

    const rangeEntries = fromDate
      ? allEntries.filter((entry) => {
          return (
            entry.timestamp >= fromDate && (!toDate || entry.timestamp <= toDate)
          );
        })
      : allEntries;

    rangeEntries.forEach((entry) => {
      if (entry.type === 'invoice') {
        totalInvoice += Number(entry.invoiceAmount || 0);
        currentBalance += Number(entry.invoiceAmount || 0);
      } else {
        totalPaid += Number(entry.paymentAmount || 0);
        currentBalance -= Number(entry.paymentAmount || 0);
      }

      statement.push({
        date: entry.date,
        type: entry.type,
        detail: entry.detail,
        invoiceAmount: entry.invoiceAmount,
        paymentAmount: entry.paymentAmount,
        balance: Math.round(currentBalance * 100) / 100,
      });
    });

    return res.json({
      customerName: customer.name,
      customerAddress: customer.address || '',
      gstNo: customer.gstNo,
      openingBalance,
      totalInvoice,
      totalPaid,
      remainingAmount: currentBalance,
      statement,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching customer billing info', 500));
  }
});

