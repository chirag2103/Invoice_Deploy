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
        const res = await axios.get(`${apiUrl}/api/purchase/summary/all`, {
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
                  {payments.map((payment) => {
                    console.log(payment);
                    return (
                      <tr key={payment._id}>
                        <td>{payment.seller?.name}</td>
                        <td>{payment.totalBills}</td>
                        <td>{payment.totalPaid}</td>
                        <td>{payment.remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h3>
                Total:{' '}
                {payments.reduce((acc, payment) => acc + payment.totalBills, 0)}
              </h3>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PurchaseSummary;
