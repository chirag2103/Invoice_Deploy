import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import TableHOC from './TableHOC';
import { fetchInvoices, deleteInvoice } from '../slices/invoiceSlice';
import api from '../utils/axios';

const InvoiceList = () => {
  const dispatch = useDispatch();
  const { invoices, loading, error } = useSelector((state) => state.invoice);

  useEffect(() => {
    loadInvoices();
  }, [dispatch]);

  const loadInvoices = async () => {
    try {
      await dispatch(fetchInvoices()).unwrap();
    } catch (err) {
      toast.error(err || 'Error fetching invoices');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await dispatch(deleteInvoice(id)).unwrap();
        toast.success('Invoice deleted successfully');
        loadInvoices();
      } catch (err) {
        toast.error(err || 'Error deleting invoice');
      }
    }
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      await api.patch(`/invoice/${id}/payment-status`, { status });
      toast.success('Payment status updated successfully');
      loadInvoices();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error updating payment status'
      );
    }
  };

  const columns = [
    {
      Header: 'Invoice Number',
      accessor: 'invoiceNumber',
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
      Header: 'Payment Status',
      accessor: 'paymentStatus',
      Cell: ({ value, row }) => (
        <select
          value={value}
          onChange={(e) =>
            updatePaymentStatus(row.original._id, e.target.value)
          }
          className={`px-2 py-1 rounded text-sm ${
            value === 'paid'
              ? 'bg-green-100 text-green-800'
              : value === 'partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <option value='pending'>Pending</option>
          <option value='partial'>Partial</option>
          <option value='paid'>Paid</option>
        </select>
      ),
    },
    {
      Header: 'Due Date',
      accessor: 'dueDate',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Actions',
      accessor: '_id',
      Cell: ({ row }) => (
        <div className='space-x-2'>
          <Link
            to={`/invoices/edit/${row.original._id}`}
            className='text-blue-600 hover:text-blue-800'
          >
            Edit
          </Link>
          <Link
            to={`/invoices/print/${row.original._id}`}
            className='text-green-600 hover:text-green-800'
          >
            Print
          </Link>
          <button
            onClick={() => handleDeleteInvoice(row.original._id)}
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
    invoices,
    'Invoices List',
    'invoices-table',
    loading
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='p-5'>
      <div className='flex justify-between items-center mb-5'>
        <h2 className='text-2xl font-bold'>Invoices</h2>
        <Link
          to='/invoices/new'
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Create New Invoice
        </Link>
      </div>
      {Table}
    </div>
  );
};

export default InvoiceList;
