import Challan from '../models/Challan.js';
import Customer from '../models/Customer.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import paginateQuery from '../utils/paginateQuery.js';
import { pickProducts } from '../utils/pickProduct.js';
import createNumberedDocument from '../services/createNumberedDocument.js';
import {
  buildFinancialYearFilter,
  getAvailableFinancialYearsForUser,
  getFinancialYearInfo,
  peekNextDocumentNumber,
} from '../utils/financialYear.js';

const CHALLAN_SEARCH_FIELDS = [
  { field: 'challanNo', type: 'number' },
  'financialYearLabel',
  { field: 'challanDate', type: 'date' },
];
const CHALLAN_ALLOWED_SORT = {
  date: { challanDate: -1 },
  '-date': { challanDate: 1 },
};
const CHALLAN_DEFAULT_SORT = { financialYearStart: -1, challanNo: -1 };

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
    isArchived: { $ne: true },
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
  const filter = {
    user: req.user.id,
    ...buildFinancialYearFilter(req.query, 'challanDate'),
  };

  const [{ data, pagination }, availableFinancialYears] = await Promise.all([
    paginateQuery(Challan, {
      filter,
      query: req.query,
      searchFields: CHALLAN_SEARCH_FIELDS,
      searchRefs: [
        {
          RefModel: Customer,
          refField: 'name',
          localField: 'customer',
          scopeField: 'user',
        },
      ],
      allowedSort: CHALLAN_ALLOWED_SORT,
      defaultSort: CHALLAN_DEFAULT_SORT,
      populate: 'customer',
    }),
    getAvailableFinancialYearsForUser(Challan, req.user.id),
  ]);

  res.status(200).json({
    challans: data,
    pagination,
    availableFinancialYears,
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
      isArchived: { $ne: true },
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
