import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { formatNumberWithCommas } from '../services/helper.js';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchaseInvoices } from '../slices/purchaseInvoiceSlice';
import { ListToolbar, PaginationControls } from './ListControls';
const PurchaseInvoiceList = () => {
  const dispatch = useDispatch();
  const { purchaseInvoices, pagination, loading, error } = useSelector(
    (state) => state.purchaseInvoice
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    dispatch(fetchPurchaseInvoices({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>Purchase Invoices</h2>
          <ListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search purchase invoices'
          />
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {purchaseInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{invoice.seller?.name || 'Unknown Seller'}</td>
                    <td>{invoice?.invoiceNo || '-'}</td>
                    <td>{formatDate(invoice.date?.split('T')[0])}</td>
                    <td>{formatNumberWithCommas(invoice.amount)}</td>
                    <td>{invoice.remarks || '-'}</td>
                  </tr>
                ))}
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
      </main>
    </div>
  );
};

export default PurchaseInvoiceList;
