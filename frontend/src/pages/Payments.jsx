import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/payments');
      setPayments(response.data.payments);
    } catch (error) {
      toast.error('Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      Header: 'Payment ID',
      accessor: 'paymentId',
    },
    {
      Header: 'Customer',
      accessor: 'customer.name',
    },
    {
      Header: 'Invoice Number',
      accessor: 'invoice.invoiceNumber',
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      Cell: ({ value }) => `₹${value.toFixed(2)}`,
    },
    {
      Header: 'Payment Method',
      accessor: 'paymentMethod',
      Cell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'cash'
              ? 'bg-green-100 text-green-800'
              : value === 'bank'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      Header: 'Payment Date',
      accessor: 'paymentDate',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ];

  const Table = TableHOC(
    columns,
    payments,
    'Payments List',
    'payments-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Payments</h2>
          <div className='flex space-x-4'>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h3 className='text-lg font-semibold mb-2'>Total Payments</h3>
              <p className='text-2xl'>
                ₹
                {payments
                  .reduce((sum, payment) => sum + payment.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h3 className='text-lg font-semibold mb-2'>Completed Payments</h3>
              <p className='text-2xl'>
                {
                  payments.filter((payment) => payment.status === 'completed')
                    .length
                }
              </p>
            </div>
          </div>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default Payments;
