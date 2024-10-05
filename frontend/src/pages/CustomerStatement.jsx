import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CustomerStatement.css';

const CustomerStatement = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { customerId } = useParams();

  useEffect(() => {
    const fetchCustomerStatement = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/statement/${customerId}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setStatementData(data);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStatement();
  }, [customerId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className='customer-statement-container'>
      <h2>Statement for {statementData.customerName}</h2>
      <p>GST No: {statementData.gstNo}</p>
      <div className='table-wrapper'>
        <table className='responsive-table'>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Invoice Amount</th>
              <th>Payment Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {statementData.statement.map((entry, index) => (
              <tr key={index}>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td>{entry.type === 'invoice' ? 'Invoice' : 'Payment'}</td>
                <td>{entry.invoiceAmount ? `₹${entry.invoiceAmount}` : '-'}</td>
                <td>{entry.paymentAmount ? `₹${entry.paymentAmount}` : '-'}</td>
                <td>₹{entry.balance}</td>
              </tr>
            ))}
            <tr>
              <td colSpan='2'>
                <b>Total:</b>
              </td>
              <td>
                <b>₹{statementData.totalInvoice}</b>
              </td>
              <td>
                <b>₹{statementData.totalPaid}</b>
              </td>
              <td>
                <b>₹{statementData.totalInvoice - statementData.totalPaid}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerStatement;
