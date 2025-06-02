import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from './TableHOC';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get('/api/quotations');
      setQuotations(response.data.quotations);
    } catch (error) {
      toast.error('Error fetching quotations');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/quotation/${id}/status`, { status });
      toast.success('Status updated successfully');
      fetchQuotations();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteQuotation = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await axios.delete(`/api/quotation/${id}`);
        toast.success('Quotation deleted successfully');
        fetchQuotations();
      } catch (error) {
        toast.error('Error deleting quotation');
      }
    }
  };

  const convertToInvoice = async (id) => {
    try {
      const response = await axios.post(
        `/api/quotation/${id}/convert-to-invoice`
      );
      toast.success('Quotation converted to invoice successfully');
      window.location.href = `/invoices/print/${response.data.invoice._id}`;
    } catch (error) {
      toast.error('Error converting quotation to invoice');
    }
  };

  const columns = [
    {
      Header: 'Quotation Number',
      accessor: 'quotationNumber',
    },
    {
      Header: 'Customer',
      accessor: 'customer.name',
    },
    {
      Header: 'Total Amount',
      accessor: 'total',
      Cell: ({ value }) => `₹${value.toFixed(2)}`,
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value, row }) => (
        <select
          value={value}
          onChange={(e) => updateStatus(row.original._id, e.target.value)}
          className={`px-2 py-1 rounded text-sm ${
            value === 'accepted'
              ? 'bg-green-100 text-green-800'
              : value === 'rejected'
              ? 'bg-red-100 text-red-800'
              : value === 'expired'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          <option value='draft'>Draft</option>
          <option value='sent'>Sent</option>
          <option value='accepted'>Accepted</option>
          <option value='rejected'>Rejected</option>
          <option value='expired'>Expired</option>
        </select>
      ),
    },
    {
      Header: 'Valid Until',
      accessor: 'validUntil',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Actions',
      accessor: '_id',
      Cell: ({ row }) => (
        <div className='space-x-2'>
          <Link
            to={`/quotations/edit/${row.original._id}`}
            className='text-blue-600 hover:text-blue-800'
          >
            Edit
          </Link>
          <Link
            to={`/quotations/print/${row.original._id}`}
            className='text-green-600 hover:text-green-800'
          >
            Print
          </Link>
          {row.original.status === 'accepted' && (
            <button
              onClick={() => convertToInvoice(row.original._id)}
              className='text-purple-600 hover:text-purple-800'
            >
              Convert to Invoice
            </button>
          )}
          <button
            onClick={() => deleteQuotation(row.original._id)}
            className='text-red-600 hover:text-red-800'
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const Table = TableHOC(
    columns,
    quotations,
    'Quotations List',
    'quotations-table',
    loading
  );

  return (
    <div className='p-5'>
      <div className='flex justify-between items-center mb-5'>
        <h2 className='text-2xl font-bold'>Quotations</h2>
        <Link
          to='/quotations/new'
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Create New Quotation
        </Link>
      </div>
      {Table}
    </div>
  );
};

export default QuotationList;
