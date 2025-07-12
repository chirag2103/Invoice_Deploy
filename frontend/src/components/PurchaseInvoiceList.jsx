import axios from 'axios';
import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';

const PurchaseInvoiceList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchPurchases = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/purchase/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-store', // Security best practice
          },
        }
      );
      setPurchases(data.purchases);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAddPayment = async (id) => {
    const paidAmount = prompt('Enter payment amount:');
    if (!paidAmount || isNaN(paidAmount)) return alert('Enter valid amount');

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/purchase/${id}/payment`,
        { amountPaid: Number(paidAmount) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      alert('Payment added successfully');
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>Purchase Invoices</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{invoice.seller}</td>
                    <td>{invoice.date?.split('T')[0]}</td>
                    <td>{invoice.amount}</td>
                    <td>{invoice.paid}</td>
                    <td>{invoice.amount - invoice.paid}</td>
                    <td>
                      <span
                        style={{
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          width: '6vw',
                          textAlign: 'center',
                          backgroundColor:
                            invoice.status === 'paid' ? 'green' : 'red',
                        }}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleAddPayment(invoice._id)}
                        disabled={invoice.status === 'paid'}
                        style={{
                          backgroundColor:
                            invoice.status === 'paid' ? '#ccc' : '#007bff',
                          color: 'white',
                          cursor:
                            invoice.status === 'paid'
                              ? 'not-allowed'
                              : 'pointer',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '4px',
                        }}
                      >
                        Add Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default PurchaseInvoiceList;
