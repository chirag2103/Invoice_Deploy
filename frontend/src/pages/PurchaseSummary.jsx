import { Column } from 'react-table';
import AdminSidebar from '../components/AdminSidebar';
import { ReactElement, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PurchaseSummary = () => {
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
        const res = await axios.get(`${apiUrl}/api/purchaseSummary/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(res);
        setPayments(res.data.summary);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
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
                    <td>Seller Name</td>
                    <td>Total Bill</td>
                    <td>Total Paid</td>
                    <td>Remaining</td>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, id) => {
                    total += payment.totalAmount;
                    return (
                      <tr key={payment._id}>
                        <td>{payment.seller}</td>
                        <td>{payment.totalAmount}</td>
                        <td>{payment.totalPaid}</td>
                        <td>{payment.remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <h3>Total: {total}</h3>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PurchaseSummary;
