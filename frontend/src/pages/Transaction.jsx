import AdminSidebar from '../components/AdminSidebar';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatNumberWithCommas } from '../services/helper.js';
import { fetchPayments } from '../slices/paymentSlice';
import { ListToolbar, PaginationControls } from '../components/ListControls';

const Transaction = () => {
  const dispatch = useDispatch();
  const { payments, pagination } = useSelector((state) => state.payment);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };
  useEffect(() => {
    document.title = 'Transactions';
    dispatch(fetchPayments({ page, limit, search }));
  }, [dispatch, page, limit, search]);
  const total = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return (
    <>
      <div className='admin-container'>
        <AdminSidebar />
        <main className='invoice-list'>
          <div className='invoice-container'>
            <ListToolbar
              title='Customer Transactions'
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder='Search payments'
            />
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
                    return (
                      <tr key={payment._id}>
                        <td>{id + 1}</td>
                        <td>{payment.customer.name}</td>
                        <td>{formatDate(payment.date.split('T')[0])}</td>
                        <td>{formatNumberWithCommas(payment.amountPaid)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <h3>Total: {formatNumberWithCommas(total)}</h3>
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

export default Transaction;
