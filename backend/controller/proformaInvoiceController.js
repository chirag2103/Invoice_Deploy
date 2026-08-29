import ProformaInvoice from '../models/ProformaInvoice.js';
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
  try {
    const numbering = await getNextDocumentNumber(
      req.user.id,
      'proforma',
      req.body.date || new Date()
    );

    const proforma = await ProformaInvoice.create({
      ...req.body,
      user: req.user.id,
      proformaNo: numbering.sequenceNumber,
      sequenceNumber: numbering.sequenceNumber,
      financialYearStart: numbering.financialYearStart,
      financialYearLabel: numbering.financialYearLabel,
    });

    res.status(201).json({
      proforma,
    });
  } catch (error) {
    next(new ErrorHandler(`Error creating proforma invoice: ${error.message}`, 500));
  }
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
  try {
    let proforma = await ProformaInvoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!proforma) {
      return next(new ErrorHandler('Proforma invoice not found', 404));
    }

    const updatePayload = { ...req.body, user: req.user.id };

    if (proforma.financialYearStart) {
      const nextFinancialYear = getFinancialYearInfo(req.body.date || proforma.date);

      if (nextFinancialYear.financialYearStart !== proforma.financialYearStart) {
        const numbering = await getNextDocumentNumber(
          req.user.id,
          'proforma',
          req.body.date || proforma.date
        );

        updatePayload.proformaNo = numbering.sequenceNumber;
        updatePayload.sequenceNumber = numbering.sequenceNumber;
        updatePayload.financialYearStart = numbering.financialYearStart;
        updatePayload.financialYearLabel = numbering.financialYearLabel;
      }
    }

    proforma = await ProformaInvoice.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      proforma,
    });
  } catch (error) {
    next(new ErrorHandler('Error updating proforma invoice', 500));
  }
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
