import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
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
  try {
    const numbering = await getNextDocumentNumber(
      req.user.id,
      'invoice',
      req.body.date || new Date()
    );

    const invoice = await Invoice.create({
      ...req.body,
      user: req.user.id,
      invoiceNo: numbering.invoiceNo,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    });

    res.status(201).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler(`Error creating invoice ${error.message}`, 500));
  }
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
  try {
    let invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!invoice) {
      return next(new ErrorHandler('Invoice not found', 404));
    }

    const updatePayload = { ...req.body, user: req.user.id };

    if (invoice.financialYearStart) {
      const nextFinancialYear = getFinancialYearInfo(req.body.date || invoice.date);

      if (nextFinancialYear.financialYearStart !== invoice.financialYearStart) {
        const numbering = await getNextDocumentNumber(
          req.user.id,
          'invoice',
          req.body.date || invoice.date
        );

        updatePayload.invoiceNo = numbering.invoiceNo;
        updatePayload.sequenceNumber = numbering.sequenceNumber;
        updatePayload.financialYearStart = numbering.financialYearStart;
        updatePayload.financialYearLabel = numbering.financialYearLabel;
      }
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error updating invoice', 500));
  }
});

export const deleteInvoice = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!invoice) {
    return next(new ErrorHandler('Product not found', 404));
  }

  await invoice.remove();

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

    if (customer.openingBalance && customer.openingBalance !== 0) {
      currentBalance = customer.openingBalance;
      statement.push({
        date: customer.createdAt || new Date('2024-01-01'),
        type: 'opening',
        detail: 'Opening Balance',
        invoiceAmount: customer.openingBalance,
        paymentAmount: null,
        balance: currentBalance,
      });
    }

    const entries = [
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
    ];

    entries.sort((first, second) => new Date(first.date) - new Date(second.date));

    entries.forEach((entry) => {
      if (entry.type === 'invoice') {
        totalInvoice += entry.invoiceAmount;
        currentBalance += entry.invoiceAmount;
      } else if (entry.type === 'payment') {
        totalPaid += entry.paymentAmount;
        currentBalance -= entry.paymentAmount;
      }

      statement.push({
        ...entry,
        balance: Math.round(currentBalance * 100) / 100,
      });
    });

    return res.json({
      customerName: customer.name,
      gstNo: customer.gstNo,
      openingBalance: customer.openingBalance || 0,
      totalInvoice,
      totalPaid,
      remainingAmount: currentBalance,
      statement,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching customer billing info', 500));
  }
});
