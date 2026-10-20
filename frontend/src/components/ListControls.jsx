import React from 'react';

export const ListToolbar = ({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  actions,
  sort,
  onSortChange,
  sortOptions = [],
}) => (
  <div className='list-toolbar'>
    <div>
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    <div className='list-toolbar-actions'>
      <input
        type='search'
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
      />
      {sortOptions.length > 0 && (
        <select aria-label='Sort by' value={sort} onChange={(event) => onSortChange(event.target.value)}>
          {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      )}
      {actions}
    </div>
  </div>
);

export const PaginationControls = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  if (!pagination) {
    return null;
  }

  return (
    <div className='list-pagination'>
      <p>
        Page {pagination.page} of {pagination.totalPages} • {pagination.totalItems}{' '}
        items
      </p>
      <div className='list-pagination-actions'>
        <select
          value={pagination.limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          {[5, 10, 20, 50].map((limit) => (
            <option key={limit} value={limit}>
              {limit} / page
            </option>
          ))}
        </select>
        <button
          type='button'
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        <button
          type='button'
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const DATE_SORT_OPTIONS = [['', 'Default order'], ['date', 'Newest first'], ['-date', 'Oldest first']];
export const AMOUNT_SORT_OPTIONS = [...DATE_SORT_OPTIONS, ['amount', 'Amount: high to low'], ['-amount', 'Amount: low to high']];
export const NAME_SORT_OPTIONS = [['name', 'Name: A to Z'], ['-name', 'Name: Z to A'], ['balance', 'Balance: high to low'], ['-balance', 'Balance: low to high']];
