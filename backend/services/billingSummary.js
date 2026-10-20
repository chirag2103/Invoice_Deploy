import { filterAndPaginate } from '../utils/listResponse.js';
import { round2 } from '../utils/money.js';

export const billingSummary = (items, query, searchFields, balanceField, totalFields) => {
  const visible = query.hideSettled === 'true'
    ? items.filter((item) => round2(item[balanceField]) !== 0)
    : items;
  const { results, pagination, matchingItems } = filterAndPaginate(visible, query, searchFields);
  const totals = Object.fromEntries(totalFields.map((field) => [
    field, round2(matchingItems.reduce((sum, item) => sum + Number(item[field] || 0), 0)),
  ]));
  return { results, pagination, totals };
};
