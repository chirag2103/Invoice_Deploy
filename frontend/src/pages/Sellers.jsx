import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { ListToolbar, PaginationControls } from '../components/ListControls';
import { fetchSellers } from '../slices/customerSlice';
import api from '../axiosSetup.js';

const initialForm = {
  name: '',
  gstNo: '',
  address: '',
  contact: '',
  openingBalance: '',
};

const Sellers = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sellers, sellerPagination, loading, error } = useSelector(
    (state) => state.customers
  );

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(fetchSellers({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        openingBalance: Number(formData.openingBalance || 0),
      };

      if (editingId) {
        await api.put(`${apiUrl}/api/seller/${editingId}`, payload);
      } else {
        await api.post(`${apiUrl}/api/seller/new`, payload);
      }

      resetForm();
      dispatch(fetchSellers({ page, limit, search }));
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Unable to save seller');
    }
  };

  const handleEdit = (seller) => {
    setEditingId(seller._id);
    setFormData({
      name: seller.name || '',
      gstNo: seller.gstNo || '',
      address: seller.address || '',
      contact: seller.contact || '',
      openingBalance: seller.openingBalance || 0,
    });
  };

  const handleDelete = async (sellerId) => {
    if (!window.confirm('Delete this seller?')) {
      return;
    }

    try {
      await api.delete(`${apiUrl}/api/seller/${sellerId}`);
      dispatch(fetchSellers({ page, limit, search }));
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Unable to delete seller');
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customer-container'>
        <div className='add-customer'>
          <p>{editingId ? 'Update Seller' : 'Create Seller'}</p>
          <form onSubmit={handleSubmit} className='invoice-form'>
            <label className='form-label'>Name</label>
            <input
              type='text'
              className='form-input'
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <label className='form-label'>GSTIN</label>
            <input
              type='text'
              className='form-input'
              value={formData.gstNo}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, gstNo: event.target.value }))
              }
            />
            <label className='form-label'>Contact</label>
            <input
              type='text'
              className='form-input'
              value={formData.contact}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, contact: event.target.value }))
              }
            />
            <label className='form-label'>Address</label>
            <textarea
              className='form-input'
              rows='4'
              value={formData.address}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, address: event.target.value }))
              }
            />
            <label className='form-label'>Opening Balance</label>
            <input
              type='number'
              className='form-input'
              value={formData.openingBalance}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  openingBalance: event.target.value,
                }))
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
            title='Sellers'
            subtitle='Manage seller details and open seller statements.'
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search sellers by name, GST, address'
          />
          {loading ? <p>Loading...</p> : null}
          {error ? <p>Error: {error}</p> : null}
          <div className='table-wrapper'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>GST</th>
                  <th>Contact</th>
                  <th>Opening</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td>{seller.name}</td>
                    <td>{seller.gstNo || '-'}</td>
                    <td>{seller.contact || '-'}</td>
                    <td>{seller.openingBalance || 0}</td>
                    <td className='row-actions'>
                      <button
                        type='button'
                        onClick={() => navigate(`/seller/${seller._id}/statement`)}
                      >
                        View
                      </button>
                      <button
                        type='button'
                        className='edit-btn'
                        onClick={() => handleEdit(seller)}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className='delete-btn'
                        onClick={() => handleDelete(seller._id)}
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
            pagination={sellerPagination}
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

export default Sellers;
