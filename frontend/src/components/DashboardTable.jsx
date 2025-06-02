import React from 'react';
import { Link } from 'react-router-dom';

const DashboardTable = ({ data, type }) => {
  const getStatusClass = (status) => {
    switch (type) {
      case 'invoice':
        return status === 'paid'
          ? 'bg-green-100 text-green-800'
          : status === 'partial'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';
      case 'quotation':
        return status === 'accepted'
          ? 'bg-green-100 text-green-800'
          : status === 'rejected'
          ? 'bg-red-100 text-red-800'
          : status === 'expired'
          ? 'bg-gray-100 text-gray-800'
          : 'bg-blue-100 text-blue-800';
      case 'challan':
        return status === 'delivered'
          ? 'bg-green-100 text-green-800'
          : status === 'cancelled'
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNumberField = () => {
    switch (type) {
      case 'invoice':
        return 'invoiceNumber';
      case 'quotation':
        return 'quotationNumber';
      case 'challan':
        return 'challanNumber';
      default:
        return 'number';
    }
  };

  const getStatusField = () => {
    switch (type) {
      case 'invoice':
        return 'paymentStatus';
      case 'quotation':
      case 'challan':
        return 'status';
      default:
        return 'status';
    }
  };

  const getLink = (item) => {
    switch (type) {
      case 'invoice':
        return `/invoices/edit/${item._id}`;
      case 'quotation':
        return `/quotations/edit/${item._id}`;
      case 'challan':
        return `/challans/edit/${item._id}`;
      default:
        return '#';
    }
  };

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Number
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Customer
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Status
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Date
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Action
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.map((item) => (
            <tr key={item._id}>
              <td className='px-6 py-4 whitespace-nowrap'>
                {item[getNumberField()]}
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                {item.customer?.name}
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                    item[getStatusField()]
                  )}`}
                >
                  {item[getStatusField()]}
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <Link
                  to={getLink(item)}
                  className='text-blue-600 hover:text-blue-900'
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardTable;
