import React from 'react';

export const ListToolbar = ({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  actions,
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
