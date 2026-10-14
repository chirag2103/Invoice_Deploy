import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, deleteInvoice } from '../slices/invoiceSlice';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axiosSetup.js';
import AdminSidebar from '../components/AdminSidebar';
import { formatNumberWithCommas } from '../services/helper.js';
import { ListToolbar, PaginationControls } from '../components/ListControls';

const CustomerInvoices = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, pagination, customerName, loading, error } =
    useSelector((state) => state.invoice);

  const [payments, setPayments] = useState([]);
  const [gTotal, setgToal] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get(
          `${apiUrl}/api/customer/${customerId}/invoices`,
          {
            params: { page, limit, search },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setgToal(response.data.total);
        const res = await api.get(
          `${apiUrl}/api/customer/${customerId}/payments`,
          {
            params: { search },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPayments(res.data.payments);
        setPaidAmount(res.data.paidAmount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
    dispatch(fetchInvoices({ customerId, page, limit, search }));
  }, [apiUrl, token, customerId, dispatch, page, limit, search]);

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
                <ListToolbar
                  search={search}
                  onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  searchPlaceholder='Search invoices and payments for this customer'
                />
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
                        <td>{formatNumberWithCommas(invoice.grandTotal)}</td>
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
                          <td>{formatNumberWithCommas(payment.amountPaid)}</td>
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
                <PaginationControls
                  pagination={pagination}
                  onPageChange={setPage}
                  onLimitChange={(value) => {
                    setLimit(value);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default CustomerInvoices;
