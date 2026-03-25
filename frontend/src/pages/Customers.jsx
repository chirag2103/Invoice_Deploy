import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { ListToolbar, PaginationControls } from '../components/ListControls';
import { fetchCustomers } from '../slices/customerSlice';
import api from '../axiosSetup.js';

const initialForm = {
  name: '',
  gstNo: '',
  address: '',
  openingBalance: '',
};

const Customers = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customers, customerPagination, loading, error } = useSelector(
    (state) => state.customers
  );

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    dispatch(fetchCustomers({ page, limit, search }));
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
        await api.put(`${apiUrl}/api/customer/${editingId}`, payload);
      } else {
        await api.post(`${apiUrl}/api/customer/new`, payload);
      }

      resetForm();
      dispatch(fetchCustomers({ page, limit, search }));
    } catch (requestError) {
      alert(
        requestError.response?.data?.message || 'Unable to save customer'
      );
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name || '',
      gstNo: customer.gstNo || '',
      address: customer.address || '',
      openingBalance: customer.openingBalance || 0,
    });
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Delete this customer?')) {
      return;
    }

    try {
      await api.delete(`${apiUrl}/api/customer/${customerId}`);
      dispatch(fetchCustomers({ page, limit, search }));
    } catch (requestError) {
      alert(
        requestError.response?.data?.message || 'Unable to delete customer'
      );
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customer-container'>
        <div className='add-customer'>
          <p>{editingId ? 'Update Customer' : 'Create Customer'}</p>
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
            title='Customers'
            subtitle='Search, edit, delete, and open invoice history.'
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search customers by name, GST, address'
          />
          {loading ? <p>Loading...</p> : null}
          {error ? <p>Error: {error}</p> : null}
          <div className='table-wrapper'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>GST</th>
                  <th>Address</th>
                  <th>Opening</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.gstNo || '-'}</td>
                    <td>{customer.address || '-'}</td>
                    <td>{customer.openingBalance || 0}</td>
                    <td className='row-actions'>
                      <button
                        type='button'
                        onClick={() => navigate(`/customer/${customer._id}/invoices`)}
                      >
                        View
                      </button>
                      <button
                        type='button'
                        className='edit-btn'
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className='delete-btn'
                        onClick={() => handleDelete(customer._id)}
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
            pagination={customerPagination}
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

export default Customers;
