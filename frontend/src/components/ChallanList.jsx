import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from './TableHOC';

const ChallanList = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    try {
      const response = await axios.get('/api/challans');
      setChallans(response.data.challans);
    } catch (error) {
      toast.error('Error fetching challans');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/challan/${id}/status`, { status });
      toast.success('Status updated successfully');
      fetchChallans();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteChallan = async (id) => {
    if (window.confirm('Are you sure you want to delete this challan?')) {
      try {
        await axios.delete(`/api/challan/${id}`);
        toast.success('Challan deleted successfully');
        fetchChallans();
      } catch (error) {
        toast.error('Error deleting challan');
      }
    }
  };

  const columns = [
    {
      Header: 'Challan Number',
      accessor: 'challanNumber',
    },
    {
      Header: 'Customer',
      accessor: 'customer.name',
    },
    {
      Header: 'Delivery Date',
      accessor: 'deliveryDate',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value, row }) => (
        <select
          value={value}
          onChange={(e) => updateStatus(row.original._id, e.target.value)}
          className={`px-2 py-1 rounded text-sm ${
            value === 'delivered'
              ? 'bg-green-100 text-green-800'
              : value === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          <option value='pending'>Pending</option>
          <option value='delivered'>Delivered</option>
          <option value='cancelled'>Cancelled</option>
        </select>
      ),
    },
    {
      Header: 'Transport',
      accessor: 'transportInfo',
    },
    {
      Header: 'Actions',
      accessor: '_id',
      Cell: ({ row }) => (
        <div className='space-x-2'>
          <Link
            to={`/challans/edit/${row.original._id}`}
            className='text-blue-600 hover:text-blue-800'
          >
            Edit
          </Link>
          <Link
            to={`/challans/print/${row.original._id}`}
            className='text-green-600 hover:text-green-800'
          >
            Print
          </Link>
          <button
            onClick={() => deleteChallan(row.original._id)}
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
    challans,
    'Challans List',
    'challans-table',
    loading
  );

  return (
    <div className='p-5'>
      <div className='flex justify-between items-center mb-5'>
        <h2 className='text-2xl font-bold'>Challans</h2>
        <Link
          to='/challans/new'
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Create New Challan
        </Link>
      </div>
      {Table}
    </div>
  );
};

export default ChallanList;
