import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchInvoices, deleteInvoice } from '../slices/invoiceSlice';
import api from '../axiosSetup';
import AdminSidebar from '../components/AdminSidebar';
import { ListToolbar, PaginationControls, AMOUNT_SORT_OPTIONS } from '../components/ListControls';
import { formatDocumentNumber, formatNumberWithCommas } from '../services/helper';
import { getErrorMessage } from '../services/apiError';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const CustomerInvoices = () => {
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, pagination, customerName, customerTotal, loading, error } = useSelector((state) => state.invoice);
  const [payments, setPayments] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentPagination, setPaymentPagination] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit, setPaymentLimit] = useState(10);
  const [paymentSort, setPaymentSort] = useState('');

  useEffect(() => {
    const request = dispatch(fetchInvoices({ customerId, page, limit, search, sort }));
    return () => request.abort();
  }, [dispatch, customerId, page, limit, search, sort]);

  useEffect(() => {
    const controller = new AbortController();
    setPaymentLoading(true);
    setPaymentError(null);
    api.get(`/api/customer/${customerId}/payments`, {
      params: { page: paymentPage, limit: paymentLimit, search, sort: paymentSort },
      signal: controller.signal,
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setPayments(data.payments || []);
      setPaidAmount(data.paidAmount || 0);
      setPaymentPagination(data.pagination);
    }).catch((failure) => {
      if (!controller.signal.aborted) setPaymentError(getErrorMessage(failure, 'Unable to load payments'));
    }).finally(() => {
      if (!controller.signal.aborted) setPaymentLoading(false);
    });
    return () => controller.abort();
  }, [customerId, paymentPage, paymentLimit, search, paymentSort]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await dispatch(deleteInvoice(id)).unwrap();
      dispatch(fetchInvoices({ customerId, page, limit, search, sort }));
    } catch (failure) {
      toast.error(typeof failure === 'string' ? failure : getErrorMessage(failure, 'Unable to delete invoice'));
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h3>Invoices of {customerName}</h3>
          {!loading && !error && !paymentLoading && !paymentError && <>
            <p>Grand Total: {formatNumberWithCommas(customerTotal)}</p>
            <p>Paid Amount: {formatNumberWithCommas(paidAmount)}</p>
            <p>Remaining Amount: {formatNumberWithCommas(customerTotal - paidAmount)}</p>
          </>}
          <ListToolbar title='Invoices' search={searchInput}
            onSearchChange={(value) => { setSearchInput(value); setPage(1); setPaymentPage(1); }}
            searchPlaceholder='Search invoices and payments' sort={sort} sortOptions={AMOUNT_SORT_OPTIONS}
            onSortChange={(value) => { setSort(value); setPage(1); }} />
          {loading && <p>Loading invoices...</p>}
          {error && <p role='alert'>{error}</p>}
          {!loading && !error && <table className='invoices-table'>
            <thead><tr><th>Invoice No</th><th>Date</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>{invoices.map((invoice) => <tr key={invoice._id}>
              <td>{formatDocumentNumber(invoice.invoiceNo, invoice.financialYearLabel)}</td>
              <td>{invoice.date?.split('T')[0]}</td>
              <td>{formatNumberWithCommas(invoice.grandTotal)}</td>
              <td><button onClick={() => navigate(`/invoices/${invoice._id}/edit`, { state: { invoice } })}>Edit</button>
                <button onClick={() => handleDelete(invoice._id)}>Delete</button></td>
            </tr>)}</tbody>
          </table>}
          <PaginationControls pagination={pagination} onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(1); }} />
          <h3>Payments</h3>
          <label>Sort payments <select value={paymentSort} onChange={(event) => { setPaymentSort(event.target.value); setPaymentPage(1); }}>
            {AMOUNT_SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          {paymentLoading && <p>Loading payments...</p>}
          {paymentError && <p role='alert'>{paymentError}</p>}
          {!paymentLoading && !paymentError && <table>
            <thead><tr><th>No.</th><th>Name</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>{payments.map((payment, index) => <tr key={payment._id}>
              <td>{((paymentPagination?.page || 1) - 1) * paymentLimit + index + 1}</td>
              <td>{customerName}</td><td>{formatNumberWithCommas(payment.amountPaid)}</td>
              <td>{payment.date?.split('T')[0]}</td>
            </tr>)}</tbody>
          </table>}
          <PaginationControls pagination={paymentPagination} onPageChange={setPaymentPage}
            onLimitChange={(value) => { setPaymentLimit(value); setPaymentPage(1); }} />
        </div>
      </main>
    </div>
  );
};
export default CustomerInvoices;
