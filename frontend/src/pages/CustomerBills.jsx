import { Link } from 'react-router-dom';
import { getErrorMessage } from '../services/apiError';
import React, { useEffect, useState } from 'react';
import api from '../axiosSetup.js';
import AdminSidebar from '../components/AdminSidebar';
import { formatNumberWithCommas } from '../services/helper.js';
import { ListToolbar, PaginationControls } from '../components/ListControls';

const CustomerBills = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({});
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hideZeroBalance, setHideZeroBalance] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    async function fetchCustomerBillingInfo() {
      try {
        const response = await api.get(`${apiUrl}/api/billingInfo`, {
          params: { page, limit, search, hideSettled: hideZeroBalance },
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (controller.signal.aborted) return;
        setCustomers(response.data.data);
        setTotals(response.data.totals || {});
        setPagination(response.data.pagination);
        setLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(error, 'Error fetching customer billing info'));
        setLoading(false);
      }
    }
    fetchCustomerBillingInfo();
    return () => controller.abort();
  }, [apiUrl, token, page, limit, search, hideZeroBalance]);

  const filteredCustomers = customers;
  const totalBill = totals.totalBill || 0;
  const totalPaid = totals.totalPaid || 0;
  const totalRemaining = totals.remainingAmount || 0;

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customerContainer'>
        <h3>Customer Billing Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <ListToolbar
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder='Search billing info'
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
              onChange={(e) => { setHideZeroBalance(!e.target.checked); setPage(1); }}
              style={{ accentColor: '#c35a20' }}
            />
            Show settled accounts
          </label>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table className='customerTable'>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Opening Balance</th>
                <th>Total Bill</th>
                <th>Paid Amount</th>
                <th>Remaining Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan='5' style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                    {hideZeroBalance ? 'No outstanding balances found.' : 'No billing records found.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.customerId || index}>
                    <td><Link to={`/statement/${customer.customerId}`}>{customer.customerName}</Link></td>
                    <td>{formatNumberWithCommas(customer.openingBalance)}</td>
                    <td>{formatNumberWithCommas(customer.totalBill)}</td>
                    <td>{formatNumberWithCommas(customer.totalPaid)}</td>
                    <td>{formatNumberWithCommas(customer.remainingAmount)}</td>
                  </tr>
                ))
              )}
              {filteredCustomers.length > 0 && (
                <tr className='totalRow'>
                  <td>Total (all matching accounts)</td>
                  <td>{formatNumberWithCommas(totals.openingBalance)}</td>
                  <td>{formatNumberWithCommas(totalBill)}</td>
                  <td>{formatNumberWithCommas(totalPaid)}</td>
                  <td>{formatNumberWithCommas(totalRemaining)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
  );
};

export default CustomerBills;
