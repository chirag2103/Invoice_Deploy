import api from '../axiosSetup.js';
import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { formatNumberWithCommas } from '../services/helper.js';
const PurchaseInvoiceList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get(
        `${process.env.REACT_APP_API_URL}/api/purchase/get/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-store',
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
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((invoice) => {
                  // console.log(invoice);
                  return (
                    <tr key={invoice._id}>
                      <td>{invoice.seller?.name || 'Unknown Seller'}</td>
                      <td>{formatDate(invoice.date?.split('T')[0])}</td>
                      <td>{formatNumberWithCommas(invoice.amount)}</td>
                      <td>{invoice.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default PurchaseInvoiceList;
