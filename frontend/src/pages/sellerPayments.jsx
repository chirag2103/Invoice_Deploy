import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import { ListToolbar, PaginationControls } from '../components/ListControls';
import { fetchSellers } from '../slices/customerSlice';
import { fetchPurchasePayments } from '../slices/purchasePaymentSlice';
import api from '../axiosSetup.js';
import { formatNumberWithCommas } from '../services/helper.js';

const initialForm = {
  seller: '',
  amountPaid: '',
  date: '',
  remarks: '',
};

const SellerPayments = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const dispatch = useDispatch();
  const { sellers } = useSelector((state) => state.customers);
  const { purchasePayments, pagination, loading, error } = useSelector(
    (state) => state.purchasePayment
  );

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(fetchSellers({ limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPurchasePayments({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`${apiUrl}/api/purchase/payment/${editingId}`, formData);
      } else {
        await api.post(`${apiUrl}/api/purchase/payment/new`, formData);
      }
      resetForm();
      dispatch(fetchPurchasePayments({ page, limit, search }));
    } catch (requestError) {
      alert(
        requestError.response?.data?.message || 'Unable to save seller payment'
      );
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment._id);
    setFormData({
      seller: payment.seller?._id || '',
      amountPaid: payment.amountPaid || '',
      date: payment.date?.split('T')[0] || '',
      remarks: payment.remarks || '',
    });
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Delete this seller payment?')) return;
    try {
      await api.delete(`${apiUrl}/api/purchase/payment/${paymentId}`);
      dispatch(fetchPurchasePayments({ page, limit, search }));
    } catch (requestError) {
      alert(
        requestError.response?.data?.message || 'Unable to delete seller payment'
      );
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customer-container'>
        <div className='add-customer'>
          <p>{editingId ? 'Update Seller Payment' : 'Add Seller Payment'}</p>
          <form className='invoice-form' onSubmit={handleSubmit}>
            <label className='form-label'>Seller</label>
            <select
              className='form-select'
              value={formData.seller}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, seller: event.target.value }))
              }
              required
            >
              <option value=''>Select seller</option>
              {sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {seller.name}
                </option>
              ))}
            </select>
            <label className='form-label'>Amount</label>
            <input
              type='number'
              className='form-input'
              value={formData.amountPaid}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  amountPaid: event.target.value,
                }))
              }
              required
            />
            <label className='form-label'>Date</label>
            <input
              type='date'
              className='form-input'
              value={formData.date}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, date: event.target.value }))
              }
              required
            />
            <label className='form-label'>Remarks</label>
            <textarea
              rows='4'
              className='form-input'
              value={formData.remarks}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, remarks: event.target.value }))
              }
            />
            <div className='form-actions'>
              <button type='submit'>{editingId ? 'Update' : 'Add'}</button>
              {editingId ? (
                <button type='button' className='delete-btn' onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
        <div className='customer-list-container'>
          <ListToolbar
            title='Purchase Payments'
            subtitle='Search and manage seller payments.'
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search by seller, amount, date, remarks'
          />
          {loading ? <p>Loading...</p> : null}
          {error ? <p>Error: {error}</p> : null}
          <div className='table-wrapper'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchasePayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.seller?.name || '-'}</td>
                    <td>{formatNumberWithCommas(payment.amountPaid)}</td>
                    <td>{payment.date?.split('T')[0] || '-'}</td>
                    <td>{payment.remarks || '-'}</td>
                    <td className='row-actions'>
                      <button
                        type='button'
                        className='edit-btn'
                        onClick={() => handleEdit(payment)}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className='delete-btn'
                        onClick={() => handleDelete(payment._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default SellerPayments;
