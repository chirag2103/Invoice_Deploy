import React from 'react';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import { BsSearch } from 'react-icons/bs';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Loader from './Loader';

const TableHOC = (
  columns,
  data,
  title,
  containerClassName,
  loading = false
) => {
  return function HOC() {
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      state,
      setGlobalFilter,
    } = useTable(
      {
        columns,
        data,
      },
      useGlobalFilter,
      useSortBy
    );

    const { globalFilter } = state;

    if (loading) {
      return <Loader />;
    }

    return (
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='p-4 border-b'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold'>{title}</h3>
            <div className='relative'>
              <input
                type='text'
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder='Search...'
                className='pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <BsSearch className='absolute left-3 top-3 text-gray-400' />
            </div>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table
            {...getTableProps()}
            className={`min-w-full divide-y divide-gray-200 ${containerClassName}`}
          >
            <thead className='bg-gray-50'>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      <div className='flex items-center space-x-1'>
                        <span>{column.render('Header')}</span>
                        <span>
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <FaSortDown className='inline' />
                            ) : (
                              <FaSortUp className='inline' />
                            )
                          ) : (
                            <FaSort className='inline opacity-30' />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className='bg-white divide-y divide-gray-200'
            >
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-6 py-4 text-center text-gray-500'
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()}>
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          className='px-6 py-4 whitespace-nowrap'
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
};

export default TableHOC;
