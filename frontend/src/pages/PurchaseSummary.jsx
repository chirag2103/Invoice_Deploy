import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosSetup.js';
import { formatNumberWithCommas } from '../services/helper.js';
import { ListToolbar, PaginationControls } from '../components/ListControls';

const PurchaseSummary = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const handleCustomerClick = (sellerId) => () => {
    // const newTabUrl = `/seller/${sellerId}/statement`;
    // window.open(newTabUrl, '_blank');

    navigate(`/seller/${sellerId}/statement`);
  };
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`${apiUrl}/api/purchase/summary/all`, {
          params: { page, limit, search },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPayments(res.data.summary);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [apiUrl, token, page, limit, search]);
  return (
    <>
      <div className='admin-container'>
        <AdminSidebar />
        <main className='invoice-list'>
          <div className='invoice-container'>
            <ListToolbar
              title='Purchase Summary'
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder='Search sellers'
            />
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
                        <td>{formatNumberWithCommas(payment.totalBills)}</td>
                        <td>{formatNumberWithCommas(payment.totalPaid)}</td>
                        <td>{formatNumberWithCommas(payment.remaining)}</td>
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
                      {formatNumberWithCommas(
                        payments.reduce(
                          (acc, payment) => acc + payment.totalBills,
                          0
                        )
                      )}
                    </td>
                    <td>
                      {formatNumberWithCommas(
                        payments.reduce(
                          (acc, payment) => acc + payment.totalPaid,
                          0
                        )
                      )}
                    </td>
                    <td>
                      {formatNumberWithCommas(
                        payments.reduce(
                          (acc, payment) => acc + payment.remaining,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <PaginationControls
                pagination={pagination}
                onPageChange={setPage}
                onLimitChange={(value) => {
                  setLimit(value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PurchaseSummary;
