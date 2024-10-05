import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
// import './CustomerBills.scss';

const CustomerBills = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCustomerBillingInfo() {
      try {
        const response = await axios.get(`${apiUrl}/api/billingInfo`);
        setCustomers(response.data.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching customer billing info');
        setLoading(false);
      }
    }
    fetchCustomerBillingInfo();
  }, []);

  const totalBill = customers.reduce(
    (acc, customer) => acc + customer.totalBill,
    0
  );
  const totalPaid = customers.reduce(
    (acc, customer) => acc + customer.totalPaid,
    0
  );
  const totalRemaining = customers.reduce(
    (acc, customer) => acc + customer.remainingAmount,
    0
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customerContainer'>
        <h3>Customer Billing Information</h3>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table className='customerTable'>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Total Bill</th>
                <th>Paid Amount</th>
                <th>Remaining Amount</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.customerName}</td>
                  <td>{customer.totalBill}</td>
                  <td>{customer.totalPaid}</td>
                  <td>{customer.remainingAmount}</td>
                </tr>
              ))}
              <tr className='totalRow'>
                <td>Total</td>
                <td>{totalBill}</td>
                <td>{totalPaid}</td>
                <td>{totalRemaining}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerBills;
