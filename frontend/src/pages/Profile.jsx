import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import api from '../axiosSetup.js';
import { loginSuccess } from '../slices/userSlice';

const Profile = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.user) || {};

  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    companyDetails: {
      name: currentUser.companyDetails?.name || '',
      address: currentUser.companyDetails?.address || '',
      gstin: currentUser.companyDetails?.gstin || '',
      mobile: currentUser.companyDetails?.mobile || '',
    },
    bankDetails: {
      accountNumber: currentUser.bankDetails?.accountNumber || '',
      bankName: currentUser.bankDetails?.bankName || '',
      branch: currentUser.bankDetails?.branch || '',
      ifsc: currentUser.bankDetails?.ifsc || '',
    },
  });

  const handleChange = (section, field, value) => {
    if (!section) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put(`${apiUrl}/api/user/me/update`, formData);
      dispatch(
        loginSuccess({
          user: data.user,
          token: localStorage.getItem('token'),
        })
      );
      alert('Profile updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update profile');
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='create-invoice-container'>
        <div className='invoice-container profile-card'>
          <h2>Profile Settings</h2>
          <p>Update account, company, and bank details used across the app.</p>
          <form className='invoice-form profile-form' onSubmit={handleSubmit}>
            <div className='profile-grid'>
              <div>
                <label className='form-label'>Name</label>
                <input
                  className='form-input'
                  value={formData.name}
                  onChange={(event) =>
                    handleChange(null, 'name', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Email</label>
                <input
                  className='form-input'
                  type='email'
                  value={formData.email}
                  onChange={(event) =>
                    handleChange(null, 'email', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Company Name</label>
                <input
                  className='form-input'
                  value={formData.companyDetails.name}
                  onChange={(event) =>
                    handleChange('companyDetails', 'name', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Company Mobile</label>
                <input
                  className='form-input'
                  value={formData.companyDetails.mobile}
                  onChange={(event) =>
                    handleChange('companyDetails', 'mobile', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>GSTIN</label>
                <input
                  className='form-input'
                  value={formData.companyDetails.gstin}
                  onChange={(event) =>
                    handleChange('companyDetails', 'gstin', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Bank Name</label>
                <input
                  className='form-input'
                  value={formData.bankDetails.bankName}
                  onChange={(event) =>
                    handleChange('bankDetails', 'bankName', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Account Number</label>
                <input
                  className='form-input'
                  value={formData.bankDetails.accountNumber}
                  onChange={(event) =>
                    handleChange(
                      'bankDetails',
                      'accountNumber',
                      event.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className='form-label'>IFSC</label>
                <input
                  className='form-input'
                  value={formData.bankDetails.ifsc}
                  onChange={(event) =>
                    handleChange('bankDetails', 'ifsc', event.target.value)
                  }
                />
              </div>
              <div>
                <label className='form-label'>Branch</label>
                <input
                  className='form-input'
                  value={formData.bankDetails.branch}
                  onChange={(event) =>
                    handleChange('bankDetails', 'branch', event.target.value)
                  }
                />
              </div>
              <div className='profile-grid-full'>
                <label className='form-label'>Company Address</label>
                <textarea
                  rows='4'
                  className='form-input'
                  value={formData.companyDetails.address}
                  onChange={(event) =>
                    handleChange(
                      'companyDetails',
                      'address',
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
            <div className='form-actions'>
              <button type='submit'>Save Changes</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
