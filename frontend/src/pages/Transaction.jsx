import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      Header: 'Transaction ID',
      accessor: 'transactionId',
    },
    {
      Header: 'Date',
      accessor: 'date',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Description',
      accessor: 'description',
    },
    {
      Header: 'Type',
      accessor: 'type',
      Cell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'credit'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      Cell: ({ value, row }) => (
        <span
          className={
            row.original.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }
        >
          ₹{value.toFixed(2)}
        </span>
      ),
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
    transactions,
    'Transactions',
    'transactions-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Transactions</h2>
          <div className='flex space-x-4'>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h3 className='text-lg font-semibold mb-2'>Total Credits</h3>
              <p className='text-2xl text-green-600'>
                ₹
                {transactions
                  .filter((t) => t.type === 'credit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h3 className='text-lg font-semibold mb-2'>Total Debits</h3>
              <p className='text-2xl text-red-600'>
                ₹
                {transactions
                  .filter((t) => t.type === 'debit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default Transaction;
