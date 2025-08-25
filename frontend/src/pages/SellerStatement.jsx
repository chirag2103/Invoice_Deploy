import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CustomerStatement.scss'; // reuse same styling

const SellerStatement = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { sellerId } = useParams();

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    const fetchSellerStatement = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/purchase/statement/${sellerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
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

    fetchSellerStatement();
  }, [sellerId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className='customer-statement-container'>
      <h2>Statement for {statementData.sellerName}</h2>
      <p>GST No: {statementData.gstNo}</p>
      <div className='table-wrapper'>
        <table className='responsive-table'>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Purchase Amount</th>
              <th>Payment Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {statementData.statement.map((entry, index) => (
              <tr key={index}>
                <td>{formatDate(entry.date.split('T')[0])}</td>
                <td>
                  {entry.type === 'purchase'
                    ? 'Purchase'
                    : entry.type === 'opening'
                    ? 'Opening Balance'
                    : 'Payment'}
                </td>
                <td>
                  {entry.type === 'purchase' ? `₹${entry.purchaseAmount}` : '-'}
                </td>
                <td>
                  {entry.type === 'payment' ? `₹${entry.paymentAmount}` : '-'}
                </td>
                <td>₹{entry.balance}</td>
              </tr>
            ))}
            <tr>
              <td colSpan='2'>
                <b>Total:</b>
              </td>
              <td>
                <b>₹{statementData.totalPurchase}</b>
              </td>
              <td>
                <b>₹{statementData.totalPaid}</b>
              </td>
              <td>
                <b>₹{statementData.balance}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerStatement;
