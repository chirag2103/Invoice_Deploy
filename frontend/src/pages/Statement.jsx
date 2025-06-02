import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';

const Statement = () => {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchStatements();
  }, [dateRange]);

  const fetchStatements = async () => {
    try {
      const response = await axios.get('/api/statements', {
        params: dateRange,
      });
      setStatements(response.data.statements);
    } catch (error) {
      toast.error('Error fetching statements');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
            value === 'income'
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
            row.original.type === 'income' ? 'text-green-600' : 'text-red-600'
          }
        >
          ₹{value.toFixed(2)}
        </span>
      ),
    },
    {
      Header: 'Balance',
      accessor: 'balance',
      Cell: ({ value }) => `₹${value.toFixed(2)}`,
    },
  ];

  const Table = TableHOC(
    columns,
    statements,
    'Statement',
    'statement-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Statement</h2>
          <div className='flex space-x-4'>
            <input
              type='date'
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className='px-3 py-2 border rounded'
            />
            <input
              type='date'
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className='px-3 py-2 border rounded'
            />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold mb-2'>Total Income</h3>
            <p className='text-2xl text-green-600'>
              ₹
              {statements
                .filter((s) => s.type === 'income')
                .reduce((sum, s) => sum + s.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold mb-2'>Total Expenses</h3>
            <p className='text-2xl text-red-600'>
              ₹
              {statements
                .filter((s) => s.type === 'expense')
                .reduce((sum, s) => sum + s.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold mb-2'>Net Balance</h3>
            <p className='text-2xl'>
              ₹
              {statements.length > 0
                ? statements[statements.length - 1].balance.toFixed(2)
                : '0.00'}
            </p>
          </div>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default Statement;
