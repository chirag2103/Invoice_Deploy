// import axios from 'axios';
// import { useState, useEffect, useMemo, useCallback } from 'react';
// import { useParams } from 'react-router-dom';
// import { useTable, useFilters, useSortBy } from 'react-table';
// import AdminSidebar from '../components/AdminSidebar';
// import TableHOC from '../components/TableHOC';

// const CustomerInvoices = () => {
//   const { customerId } = useParams();
//   const [invoices, setInvoices] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [gTotal, setgToal] = useState();
//   const [paidAmount, setPaidAmount] = useState();
//   const [customerName, setCustomerName] = useState();
//   const [filterInput, setFilterInput] = useState('');

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const response = await axios.get(
//           `http://localhost:4000/api/customer/${customerId}/invoices`
//         );
//         setInvoices(response.data.invoices);
//         setgToal(response.data.total);
//         setCustomerName(response.data.customerName);
//         console.log(response.data.invoices);
//         const res = await axios.get(
//           `http://localhost:4000/api/customer/${customerId}/payments`
//         );
//         setPayments(res.data.payments);
//         setPaidAmount(res.data.paidAmount);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     }
//     fetchData();
//   }, []);

//   const handleMarkAsPaid = (invoiceId) => {
//     setInvoices((prevInvoices) =>
//       prevInvoices.map((invoice) =>
//         invoice._id === invoiceId
//           ? { ...invoice, paidAmount: invoice.grandTotal, remainingAmount: 0 }
//           : invoice
//       )
//     );
//   };

//   const handleMarkAsRemaining = (invoiceId) => {
//     setInvoices((prevInvoices) =>
//       prevInvoices.map((invoice) =>
//         invoice._id === invoiceId
//           ? { ...invoice, paidAmount: 0, remainingAmount: invoice.grandTotal }
//           : invoice
//       )
//     );
//   };

//   //   const columns = [
//   //     { Header: 'Invoice No', accessor: 'invoiceNo' },
//   //     { Header: 'Date', accessor: 'date' },
//   //     { Header: 'Total', accessor: 'invoiceTotal' },
//   //     { Header: 'Paid', accessor: 'paidAmount' },
//   //     { Header: 'Remaining', accessor: 'remainingAmount' },
//   //     { Header: 'Grand Total', accessor: 'grandTotal' },
//   //     {
//   //       Header: 'Status',
//   //       accessor: (row) => (row.remainingAmount === 0 ? 'Paid' : 'Remaining'),
//   //     },
//   //     {
//   //       Header: 'Actions',
//   //       Cell: ({ row }) => (
//   //         <div>
//   //           {row.original.remainingAmount !== 0 ? (
//   //             <button onClick={() => handleMarkAsPaid(row.original._id)}>
//   //               Mark as Paid
//   //             </button>
//   //           ) : (
//   //             <button onClick={() => handleMarkAsRemaining(row.original._id)}>
//   //               Mark as Remaining
//   //             </button>
//   //           )}
//   //         </div>
//   //       ),
//   //     },
//   //   ];
//   const columns = useMemo(
//     () => [
//       { Header: 'Invoice No', accessor: 'invoiceNo' },
//       { Header: 'Date', accessor: 'date' },
//       { Header: 'Total', accessor: 'invoiceTotal' },
//       { Header: 'Paid', accessor: 'paidAmount' },
//       { Header: 'Remaining', accessor: 'remainingAmount' },
//       { Header: 'Grand Total', accessor: 'grandTotal' },
//       {
//         Header: 'Status',
//         accessor: (row) => (row.remainingAmount === 0 ? 'Paid' : 'Remaining'),
//       },
//       {
//         Header: 'Actions',
//         Cell: ({ row }) => (
//           <div>
//             {row.original.remainingAmount !== 0 ? (
//               <button onClick={() => handleMarkAsPaid(row.original._id)}>
//                 Mark as Paid
//               </button>
//             ) : (
//               <button onClick={() => handleMarkAsRemaining(row.original._id)}>
//                 Mark as Remaining
//               </button>
//             )}
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const data = useMemo(() => invoices, [invoices]);

//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     rows,
//     prepareRow,
//     setFilter,
//   } = useTable({ columns, data }, useFilters, useSortBy);

//   const Table = useCallback(
//     TableHOC(columns, invoices, 'dashboard-product-box', 'Invoices', true)
//   );

//   return (
//     <div className='admin-container'>
//       {/* AdminSideBar */}
//       <AdminSidebar />
//       <div>
//         <span>
//           <h3>Invoice for {customerName}</h3>
//           <h3>Total: {gTotal}</h3>
//           <h3>Paid Amount:{paidAmount}</h3>
//           <h3>Remaining Amount: {gTotal - paidAmount}</h3>
//         </span>
//         {/* <h1>Invoices for Customer {customerId}</h1>
//         <input
//           value={filterInput}
//           onChange={(e) => {
//             setFilter('status', e.target.value || undefined); // Set undefined to remove the filter entirely
//             setFilterInput(e.target.value);
//           }}
//           placeholder={'Search by status'}
//         />
//         <table {...getTableProps()} className='dashboard-product-box'>
//           <thead>
//             {headerGroups.map((headerGroup) => (
//               <tr {...headerGroup.getHeaderGroupProps()}>
//                 {headerGroup.headers.map((column) => (
//                   <th {...column.getHeaderProps(column.getSortByToggleProps())}>
//                     {column.render('Header')}
//                     <span>
//                       {column.isSorted
//                         ? column.isSortedDesc
//                           ? ' 🔽'
//                           : ' 🔼'
//                         : ''}
//                     </span>
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody {...getTableBodyProps()}>
//             {rows.map((row) => {
//               prepareRow(row);
//               return (
//                 <tr {...row.getRowProps()}>
//                   {row.cells.map((cell) => (
//                     <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
//                   ))}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table> */}
//         {/* <main>{Table()}</main> */}
//         <main>{Table()}</main>
//         {/* <TableHOC
//           columns={columns}
//           data={invoices}
//           containerClassname='dashboard-product-box'
//           heading='Invoices'
//           showPagination={true}
//         /> */}
//       </div>
//     </div>
//   );
// };

// export default CustomerInvoices;

// components / CustomerInvoices.jsx;
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, deleteInvoice } from '../slices/invoiceSlice';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';

const CustomerInvoices = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, loading, error } = useSelector((state) => state.invoice);

  const [payments, setPayments] = useState([]);
  const [gTotal, setgToal] = useState();
  const [paidAmount, setPaidAmount] = useState();
  const [customerName, setCustomerName] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('id:' + customerId);
        const response = await axios.get(
          `${apiUrl}/api/customer/${customerId}/invoices`
        );
        setgToal(response.data.total);
        setCustomerName(response.data.customerName);
        console.log(response.data.invoices);
        const res = await axios.get(
          `${apiUrl}/api/customer/${customerId}/payments`
        );
        setPayments(res.data.payments);
        setPaidAmount(res.data.paidAmount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
    dispatch(fetchInvoices(customerId));
  }, []);

  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      dispatch(deleteInvoice(invoiceId));
    }
  };

  const handleEdit = (invoice) => {
    navigate(`/invoices/${invoice._id}/edit`, { state: { invoice } });
  };

  return (
    <>
      <div className='admin-container'>
        <AdminSidebar />
        <div className='customer-container'>
          <main className='invoice-list'>
            <h3>Invoices of {customerName}</h3>
            <h3>Grand Total: {gTotal}</h3>
            <h3>Paid Amount: {paidAmount}</h3>
            <h3>Remaining Amount: {gTotal - paidAmount}</h3>

            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : (
              <div className='invoice-container'>
                <table className='invoices-table'>
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNo}</td>
                        <td>{invoice.date.split('T')[0]}</td>
                        <td>{invoice.grandTotal}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(invoice)}
                            className='edit-btn'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(invoice._id)}
                            className='delete-btn'
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className='payment-container'>
                  <table>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, id) => (
                        <tr key={id + 1}>
                          <td>{id + 1}</td>
                          <td>{customerName}</td>
                          <td>{payment.amountPaid}</td>
                          <td>{payment.date.split('T')[0]}</td>
                          {/* <td>
                  <button
                    onClick={() => handleEdit(invoice)}
                    className='edit-btn'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(invoice._id)}
                    className='delete-btn'
                  >
                    Delete
                  </button>
                </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CustomerInvoices;
