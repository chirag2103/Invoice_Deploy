import { Column } from 'react-table';
import AdminSidebar from '../components/AdminSidebar';
import { ReactElement, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Transaction = () => {
  const [payments, setPayments] = useState([]);
  var total = 0;
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`http://localhost:4000/api/payments`);
        setPayments(res.data.payments);
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
                    <td>Invoice No</td>
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
                        <td>{payment.customer.name}</td>
                        <td>{payment.date.split('T')[0]}</td>
                        <td>{payment.amountPaid}</td>
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

export default Transaction;
