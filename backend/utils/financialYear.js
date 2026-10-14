import DocumentSequence from '../models/DocumentSequence.js';
import ErrorHandler from './errorHandler.js';

export const getFinancialYearStart = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  return month >= 3 ? year : year - 1;
};

export const formatFinancialYearLabel = (startYear) =>
  `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;

export const getFinancialYearInfo = (dateInput = new Date()) => {
  const financialYearStart = getFinancialYearStart(dateInput);

  return {
    financialYearStart,
    financialYearEnd: financialYearStart + 1,
    financialYearLabel: formatFinancialYearLabel(financialYearStart),
  };
};

export const getFinancialYearDateRange = (fyValue) => {
  const normalized = String(fyValue || '').trim();

  if (!normalized) {
    const { financialYearStart, financialYearLabel } = getFinancialYearInfo();
    return {
      financialYearStart,
      financialYearLabel,
      startDate: new Date(Date.UTC(financialYearStart, 3, 1, 0, 0, 0, 0)),
      endDate: new Date(
        Date.UTC(financialYearStart + 1, 2, 31, 23, 59, 59, 999)
      ),
    };
  }

  const shortMatch = normalized.match(/^(\d{2})-(\d{2})$/);
  if (shortMatch) {
    const start = Number(`20${shortMatch[1]}`);
    return {
      financialYearStart: start,
      financialYearLabel: normalized,
      startDate: new Date(Date.UTC(start, 3, 1, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(start + 1, 2, 31, 23, 59, 59, 999)),
    };
  }

  const longMatch = normalized.match(/^(\d{4})-(\d{4})$/);
  if (longMatch) {
    const start = Number(longMatch[1]);
    return {
      financialYearStart: start,
      financialYearLabel: formatFinancialYearLabel(start),
      startDate: new Date(Date.UTC(start, 3, 1, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(start + 1, 2, 31, 23, 59, 59, 999)),
    };
  }

  throw new ErrorHandler('Invalid financial year. Use format like 25-26.', 400);
};

export const buildFinancialYearFilter = (query, fieldName) => {
  if (!query.financialYear) {
    return {};
  }

  const { startDate, endDate } = getFinancialYearDateRange(query.financialYear);
  return {
    [fieldName]: {
      $gte: startDate,
      $lte: endDate,
    },
  };
};

export const getNextDocumentNumber = async (
  userId,
  documentType,
  dateInput,
  session
) => {
  const { financialYearStart, financialYearLabel } = getFinancialYearInfo(
    dateInput
  );

  const sequence = await DocumentSequence.findOneAndUpdate(
    {
      user: userId,
      documentType,
      financialYearStart,
    },
    {
      $inc: { currentNumber: 1 },
      $setOnInsert: {
        user: userId,
        documentType,
        financialYearStart,
      },
    },
    {
      new: true,
      upsert: true,
      session,
    }
  );

  return {
    invoiceNo: sequence.currentNumber,
    quoteNo: sequence.currentNumber,
    challanNo: sequence.currentNumber,
    sequenceNumber: sequence.currentNumber,
    financialYearStart,
    financialYearLabel,
  };
};

export const peekNextDocumentNumber = async (userId, documentType, dateInput) => {
  const { financialYearStart, financialYearLabel } = getFinancialYearInfo(
    dateInput
  );

  const sequence = await DocumentSequence.findOne({
    user: userId,
    documentType,
    financialYearStart,
  }).lean();

  const nextNumber = (sequence?.currentNumber || 0) + 1;

  return {
    nextNumber,
    financialYearStart,
    financialYearLabel,
  };
};

export const formatDocumentDisplayNumber = (documentNumber, financialYearLabel) =>
  financialYearLabel ? `${financialYearLabel}/${documentNumber}` : String(documentNumber);

/**
 * List of financial years a user has documents in, for a list page's FY
 * filter dropdown. Uses `distinct` (index-friendly, returns only the unique
 * labels) instead of loading every document — replaces the old pattern of
 * fetching `date`/`financialYearLabel` for the whole collection on every
 * list request.
 */
export const getAvailableFinancialYearsForUser = async (Model, userId) => {
  const labels = await Model.distinct('financialYearLabel', {
    user: userId,
    financialYearLabel: { $exists: true, $nin: [null, ''] },
  });

  const currentLabel = getFinancialYearInfo().financialYearLabel;
  const unique = new Set([...labels, currentLabel]);

  return Array.from(unique).sort((first, second) => {
    const firstYear = Number(`20${String(first).split('-')[0]}`);
    const secondYear = Number(`20${String(second).split('-')[0]}`);
    return secondYear - firstYear;
  });
};
