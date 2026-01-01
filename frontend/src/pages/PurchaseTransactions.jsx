import { Column } from 'react-table';
import AdminSidebar from '../components/AdminSidebar';
import { ReactElement, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../axiosSetup.js';
import { formatNumberWithCommas } from '../services/helper.js';

const PurchaseTransaction = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [payments, setPayments] = useState([]);
  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };
  var total = 0;
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`${apiUrl}/api/purchase/payments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log(res.data);
        setPayments(res.data.payments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    document.title = 'Transactions';
    fetchData();
  }, []);
  return (
    <>
      <div className='admin-container'>
        <AdminSidebar />
        <main className='invoice-list'>
          <div className='invoice-container'>
            <div>
              <table>
                <thead>
                  <tr>
                    <td>Sr. No</td>
                    <td>Company</td>
                    <td>Date</td>
                    <td>Amount</td>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, id) => {
                    total += payment.amountPaid;
                    return (
                      <tr key={payment._id}>
                        <td>{id + 1}</td>
                        <td>{payment.seller.name}</td>
                        <td>{formatDate(payment.date.split('T')[0])}</td>
                        <td>{formatNumberWithCommas(payment.amountPaid)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <h3>Total: {formatNumberWithCommas(total)}</h3>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PurchaseTransaction;
