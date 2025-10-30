import { Column } from 'react-table';
import AdminSidebar from '../components/AdminSidebar';
import { ReactElement, useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axiosSetup.js';

const PurchaseSummary = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [payments, setPayments] = useState([]);
  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };
  var total = 0;
  const handleCustomerClick = (sellerId) => () => {
    // const newTabUrl = `/seller/${sellerId}/statement`;
    // window.open(newTabUrl, '_blank');

    navigate(`/seller/${sellerId}/statement`);
  };
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`${apiUrl}/api/purchase/summary/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log(res);
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
                    // console.log(payment);
                    return (
                      <tr
                        key={payment._id}
                        onClick={handleCustomerClick(payment.seller._id)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = '#f5f5f5')
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'transparent')
                        }
                      >
                        <td>{payment.seller?.name}</td>
                        <td>{payment.totalBills}</td>
                        <td>{payment.totalPaid}</td>
                        <td>{payment.remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      backgroundColor: '#f8f9fa',
                      fontWeight: 'bold',
                      borderTop: '2px solid #dee2e6',
                    }}
                  >
                    <td>Total</td>
                    <td>
                      {payments.reduce(
                        (acc, payment) => acc + payment.totalBills,
                        0
                      )}
                    </td>
                    <td>
                      {payments.reduce(
                        (acc, payment) => acc + payment.totalPaid,
                        0
                      )}
                    </td>
                    <td>
                      {payments.reduce(
                        (acc, payment) => acc + payment.remaining,
                        0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PurchaseSummary;
