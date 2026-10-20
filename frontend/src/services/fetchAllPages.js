import api from '../axiosSetup';

// Honor the server's page size and continue until every page has been read.
export const fetchAllPages = async (url, key, params = {}, signal) => {
  const items = [];
  let page = 1;
  let hasNextPage;
  do {
    const { data } = await api.get(url, {
      params: { ...params, page, limit: 500 },
      signal,
    });
    items.push(...(data[key] || []));
    hasNextPage = data.pagination?.hasNextPage;
    page += 1;
  } while (hasNextPage);
  return items;
};
