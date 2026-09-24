import Challan from '../models/Challan.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { filterAndPaginate } from '../utils/listResponse.js';
import { pickProducts } from '../utils/pickProduct.js';
import createNumberedDocument from '../services/createNumberedDocument.js';
import {
  buildFinancialYearFilter,
  getAvailableFinancialYearsFromDocuments,
  getFinancialYearInfo,
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
  const {
    customer,
    challanProducts,
    challanDate,
    orderNo,
    orderDate,
    shipTo,
  } = req.body;

  if (
    !customer ||
    !challanDate ||
    !Array.isArray(challanProducts) ||
    challanProducts.length === 0
  ) {
    return next(
      new ErrorHandler(
        'Customer, challan date and at least one product are required',
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

  const products = pickProducts(challanProducts);

  const challan = await createNumberedDocument({
    Model: Challan,
    userId: req.user.id,
    documentType: 'challan',
    dateInput: challanDate,
    buildDoc: ({ numbering }) => ({
      user: req.user.id,
      customer,
      shipTo: shipTo || undefined,
      challanProducts: products,
      challanDate,
      orderNo,
      orderDate,
      challanNo: numbering.challanNo,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    }),
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
  const challan = await Challan.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!challan) {
    return next(new ErrorHandler('Challan not found', 404));
  }

  const { customer, challanProducts, challanDate, orderNo, orderDate, shipTo } =
    req.body;

  if (challan.financialYearStart && challanDate) {
    const nextFinancialYear = getFinancialYearInfo(challanDate);
    if (nextFinancialYear.financialYearStart !== challan.financialYearStart) {
      return next(
        new ErrorHandler(
          'Cannot move a numbered challan to a different financial year. Create a new one instead.',
          409
        )
      );
    }
  }

  if (customer && String(customer) !== String(challan.customer)) {
    const customerDoc = await Customer.findOne({
      _id: customer,
      user: req.user.id,
    });
    if (!customerDoc) {
      return next(new ErrorHandler('Customer not found', 404));
    }
    challan.customer = customer;
  }

  if (Array.isArray(challanProducts)) {
    challan.challanProducts = pickProducts(challanProducts);
  }
  if (challanDate !== undefined) challan.challanDate = challanDate;
  if (orderNo !== undefined) challan.orderNo = orderNo;
  if (orderDate !== undefined) challan.orderDate = orderDate;
  if (shipTo !== undefined) challan.shipTo = shipTo || undefined;

  await challan.save();

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
