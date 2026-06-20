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
  const [hideZeroBalance, setHideZeroBalance] = useState(true);

  const handleCustomerClick = (sellerId) => () => {
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

  const filteredPayments = hideZeroBalance
    ? payments.filter((p) => p.remaining !== 0)
    : payments;

  return (
    <>
      <div className='admin-container'>
        <AdminSidebar />
        <main className='invoice-list'>
          <div className='invoice-container'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ListToolbar
                  title='Purchase Summary'
                  search={search}
                  onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  searchPlaceholder='Search sellers'
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  color: '#4b5563',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                <input
                  type='checkbox'
                  checked={!hideZeroBalance}
                  onChange={(e) => setHideZeroBalance(!e.target.checked)}
                  style={{ accentColor: '#c35a20' }}
                />
                Show settled accounts
              </label>
            </div>
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
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan='4' style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                        {hideZeroBalance ? 'No outstanding balances found.' : 'No purchase records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
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
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                      >
                        <td>{payment.seller?.name}</td>
                        <td>{formatNumberWithCommas(payment.totalBills)}</td>
                        <td>{formatNumberWithCommas(payment.totalPaid)}</td>
                        <td>{formatNumberWithCommas(payment.remaining)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
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
                          filteredPayments.reduce(
                            (acc, payment) => acc + payment.totalBills,
                            0
                          )
                        )}
                      </td>
                      <td>
                        {formatNumberWithCommas(
                          filteredPayments.reduce(
                            (acc, payment) => acc + payment.totalPaid,
                            0
                          )
                        )}
                      </td>
                      <td>
                        {formatNumberWithCommas(
                          filteredPayments.reduce(
                            (acc, payment) => acc + payment.remaining,
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
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
