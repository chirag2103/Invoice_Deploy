// import { BsSearch } from 'react-icons/bs';
// import AdminSidebar from '../components/AdminSidebar';
// import { BarChart1, LineChart, PieChart } from '../components/Charts';
// import { FaRegBell } from 'react-icons/fa';
// const Customers = () => {
//   const months = [
//     'January',
//     'February',
//     'March',
//     'April',
//     'May',
//     'June',
//     'July',
//     'Aug',
//     'Sept',
//     'Oct',
//     'Nov',
//     'Dec',
//   ];
//   return (
//     <div className='admin-container'>
//       <AdminSidebar />
//       <section className='customer'>
//         <div className='bar'>
//           <BsSearch />
//           <input type='text' placeholder='Search for data,users,docs' />
//           <FaRegBell />
//           <img src={userImg} alt='User' />
//         </div>
//         <div className='pie-container'>
//           <div className='pie-chart'>
//             <h2>Ports (Open/Closed)</h2>
//             <PieChart
//               labels={['Open Ports', 'Closed Ports']}
//               label={'No of Ports'}
//               data={[12, 19]}
//               backgroundColor={[
//                 'rgba(255, 99, 132, 0.2)',
//                 'rgba(54, 162, 235, 0.2)',
//               ]}
//               borderColor={['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)']}
//               borderWidth={1}
//             />
//           </div>
//           <div className='bar1-chart'>
//             <h2>Events & Count</h2>
//             <BarChart1
//               data_1={[200, 444, 343, 556, 778, 455, 990]}
//               title_1='Events'
//               bgColor_1='rgb(0,115,255)'
//             />
//             {/* Graph */}
//           </div>
//         </div>
//         <div className='line-container'>
//           <div className='line-chart'>
//             <h2>No. of IP Address</h2>
//             <LineChart
//               data={[
//                 200, 444, 444, 556, 778, 455, 990, 1444, 256, 447, 1000, 1200,
//               ]}
//               label='Users'
//               borderColor='rgb(53, 162, 255)'
//               backgroundColor='rgba(53, 162, 255,0.5)'
//               labels={months}
//             />
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Customers;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/api/customers/${id}`);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        toast.error('Error deleting customer');
      }
    }
  };

  const columns = [
    {
      Header: 'Name',
      accessor: 'name',
    },
    {
      Header: 'Email',
      accessor: 'email',
    },
    {
      Header: 'Phone',
      accessor: 'phone',
    },
    {
      Header: 'Total Invoices',
      accessor: 'invoiceCount',
    },
    {
      Header: 'Total Amount',
      accessor: 'totalAmount',
      Cell: ({ value }) => `₹${value.toFixed(2)}`,
    },
    {
      Header: 'Actions',
      accessor: '_id',
      Cell: ({ row }) => (
        <div className='space-x-2'>
          <Link
            to={`/customers/${row.original._id}/invoices`}
            className='text-blue-600 hover:text-blue-800'
          >
            View Invoices
          </Link>
          <Link
            to={`/customers/edit/${row.original._id}`}
            className='text-green-600 hover:text-green-800'
          >
            Edit
          </Link>
          <button
            onClick={() => deleteCustomer(row.original._id)}
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
    customers,
    'Customers List',
    'customers-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Customers</h2>
          <Link
            to='/customers/new'
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Add New Customer
          </Link>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default Customers;
