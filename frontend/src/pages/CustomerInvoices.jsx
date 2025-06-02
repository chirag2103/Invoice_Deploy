import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';

const CustomerInvoices = () => {
  const { customerId } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchCustomerInvoices();
  }, [customerId]);

  const fetchCustomerInvoices = async () => {
    try {
      const [customerRes, invoicesRes] = await Promise.all([
        axios.get(`/api/customers/${customerId}`),
        axios.get(`/api/customers/${customerId}/invoices`),
      ]);
      setCustomer(customerRes.data.customer);
      setInvoices(invoicesRes.data.invoices);
    } catch (error) {
      toast.error('Error fetching customer invoices');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      await axios.patch(`/api/invoice/${id}/payment-status`, { status });
      toast.success('Payment status updated successfully');
      fetchCustomerInvoices();
    } catch (error) {
      toast.error('Error updating payment status');
    }
  };

  const columns = [
    {
      Header: 'Invoice Number',
      accessor: 'invoiceNumber',
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
        </div>
      ),
    },
  ];

  const Table = TableHOC(
    columns,
    invoices,
    'Customer Invoices',
    'customer-invoices-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        {customer && (
          <div className='mb-6'>
            <h2 className='text-2xl font-bold mb-2'>
              {customer.name}'s Invoices
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='text-lg font-semibold mb-2'>Total Invoices</h3>
                <p className='text-2xl'>{invoices.length}</p>
              </div>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='text-lg font-semibold mb-2'>Total Amount</h3>
                <p className='text-2xl'>
                  ₹
                  {invoices
                    .reduce((sum, invoice) => sum + invoice.total, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='text-lg font-semibold mb-2'>Pending Amount</h3>
                <p className='text-2xl'>
                  ₹
                  {invoices
                    .filter(
                      (invoice) =>
                        invoice.paymentStatus === 'pending' ||
                        invoice.paymentStatus === 'partial'
                    )
                    .reduce((sum, invoice) => sum + invoice.total, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
        {Table}
      </main>
    </div>
  );
};

export default CustomerInvoices;
