import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
// import './CustomerDetails.css';

const CustomerBills = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCustomerBillingInfo() {
      try {
        const response = await axios.get(
          'https://invoice-deploy.onrender.com/api/billingInfo'
        );
        setCustomers(response.data.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching customer billing info');
        setLoading(false);
      }
    }
    fetchCustomerBillingInfo();
  }, []);

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customer-container'>
        <h3>Customer Billing Information</h3>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table className='customer-table'>
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
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerBills;
