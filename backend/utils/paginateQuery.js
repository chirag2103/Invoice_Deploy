import { escapeRegex } from './escapeRegex.js';

/**
 * Real DB-side pagination/sort/search — replaces the old pattern of loading a
 * user's entire collection into Node and slicing it in memory.
 *
 * Keeps the exact `pagination` response shape the frontend already expects
 * (`{page, limit, totalItems, totalPages, hasPrevPage, hasNextPage, search}`)
 * so callers/slices don't need to change.
 *
 * `searchFields` entries:
 *   - 'name'                                   -> regex match on a string field
 *   - { field: 'invoiceNo', type: 'number' }    -> regex match on the stringified number
 *   - { field: 'date', type: 'date' }           -> regex match on YYYY-MM-DD
 *
 * `searchRefs` entries (cross-collection, e.g. search invoices by customer name):
 *   { RefModel: Customer, refField: 'name', localField: 'customer', scopeField: 'user' }
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LEN = 64;

const buildSearchClause = (searchFields, term) => {
  const escaped = escapeRegex(term);
  return searchFields.map((entry) => {
    const field = typeof entry === 'string' ? entry : entry.field;
    const type = typeof entry === 'string' ? 'string' : entry.type || 'string';

    if (type === 'number') {
      return {
        $expr: {
          $regexMatch: {
            input: { $toString: `$${field}` },
            regex: escaped,
            options: 'i',
          },
        },
      };
    }

    if (type === 'date') {
      return {
        $expr: {
          $regexMatch: {
            input: { $dateToString: { date: `$${field}`, format: '%Y-%m-%d' } },
            regex: escaped,
            options: 'i',
          },
        },
      };
    }

    return { [field]: { $regex: escaped, $options: 'i' } };
  });
};

export const paginateQuery = async (
  Model,
  {
    filter = {},
    query = {},
    searchFields = [],
    searchRefs = [],
    allowedSort = {},
    defaultSort = { _id: -1 },
    dateField,
    populate,
    collation,
    maxLimit = MAX_LIMIT,
    defaultLimit = DEFAULT_LIMIT,
  } = {}
) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit)
  );

  const mongoFilter = { ...filter };

  if (dateField && (query.from || query.to)) {
    const range = {};
    if (query.from) {
      const from = new Date(`${query.from}T00:00:00.000`);
      if (!Number.isNaN(from.getTime())) range.$gte = from;
    }
    if (query.to) {
      const to = new Date(`${query.to}T23:59:59.999`);
      if (!Number.isNaN(to.getTime())) range.$lte = to;
    }
    if (Object.keys(range).length) {
      mongoFilter[dateField] = { ...(mongoFilter[dateField] || {}), ...range };
    }
  }

  const searchTerm = String(query.search || '').trim().slice(0, MAX_SEARCH_LEN);

  if (searchTerm) {
    const orClauses = buildSearchClause(searchFields, searchTerm);

    for (const ref of searchRefs) {
      const refFilter = {
        [ref.refField]: { $regex: escapeRegex(searchTerm), $options: 'i' },
      };
      if (ref.scopeField && filter[ref.scopeField] !== undefined) {
        refFilter[ref.scopeField] = filter[ref.scopeField];
      }
      const matches = await ref.RefModel.find(refFilter).select('_id').lean();
      if (matches.length) {
        orClauses.push({ [ref.localField]: { $in: matches.map((m) => m._id) } });
      }
    }

    mongoFilter.$and = [
      ...(mongoFilter.$and || []),
      orClauses.length ? { $or: orClauses } : { _id: null },
    ];
  }

  let sort = defaultSort;
  if (
    query.sort &&
    Object.prototype.hasOwnProperty.call(allowedSort, query.sort)
  ) {
    sort = allowedSort[query.sort];
  }

  const totalItems = await Model.countDocuments(mongoFilter);
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);
  const clampedPage = Math.min(page, totalPages);
  const skip = (clampedPage - 1) * limit;

  let findQuery = Model.find(mongoFilter).sort(sort).skip(skip).limit(limit).lean();
  if (populate) findQuery = findQuery.populate(populate);
  if (collation) findQuery = findQuery.collation(collation);

  const data = await findQuery;

  return {
    data,
    pagination: {
      page: clampedPage,
      limit,
      totalItems,
      totalPages,
      hasPrevPage: clampedPage > 1,
      hasNextPage: clampedPage < totalPages,
      search: searchTerm,
    },
  };
};

export default paginateQuery;
