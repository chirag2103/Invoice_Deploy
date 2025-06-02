import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';
// import './CustomerBills.scss';

const CustomerBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/bills');
      setBills(response.data.bills);
    } catch (error) {
      toast.error('Error fetching bills');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      Header: 'Bill Number',
      accessor: 'billNumber',
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
      Cell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'paid'
              ? 'bg-green-100 text-green-800'
              : value === 'partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
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
            to={`/bills/edit/${row.original._id}`}
            className='text-blue-600 hover:text-blue-800'
          >
            Edit
          </Link>
          <Link
            to={`/bills/print/${row.original._id}`}
            className='text-green-600 hover:text-green-800'
          >
            Print
          </Link>
        </div>
      ),
    },
  ];

  const Table = TableHOC(columns, bills, 'Bills List', 'bills-table', loading);

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Customer Bills</h2>
          <Link
            to='/bills/new'
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Create New Bill
          </Link>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default CustomerBills;
