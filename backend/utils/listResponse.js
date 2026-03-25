export const getNestedValue = (obj, path) =>
  path.split('.').reduce((acc, key) => acc?.[key], obj);

export const filterAndPaginate = (items, query, searchFields = []) => {
  const search = (query.search || '').trim().toLowerCase();
  const requestedPage = Math.max(parseInt(query.page, 10) || 1, 1);
  const filteredItems = search
    ? items.filter((item) =>
        searchFields.some((field) =>
          String(getNestedValue(item, field) ?? '')
            .toLowerCase()
            .includes(search),
        ),
      )
    : items;
  const defaultLimit = filteredItems.length || 1;
  const limit = Math.max(parseInt(query.limit, 10) || defaultLimit, 1);

  const totalItems = filteredItems.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * limit;

  return {
    results: filteredItems.slice(startIndex, startIndex + limit),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      search: query.search || '',
    },
  };
};
