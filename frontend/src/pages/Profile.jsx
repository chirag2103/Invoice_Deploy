import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import api from '../axiosSetup.js';
import { loginSuccess } from '../slices/userSlice';

const MAX_SIGNATURE_SIZE_BYTES = 1024 * 1024;

const TEMPLATE_OPTIONS = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional fully-bordered grid layout. All columns and rows have borders. Amount in words on left, totals on right.',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Dark blue header bar, card-style sections, alternating table row colors, accent highlights — no vertical table lines.',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Borderless, open layout with thin horizontal rules. Clean typography, totals right-aligned, generous whitespace.',
  },
];

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
    signature: currentUser.signature?.dataUrl
      ? {
          dataUrl: currentUser.signature.dataUrl,
          contentType: currentUser.signature.contentType || '',
          fileName: currentUser.signature.fileName || 'signature',
        }
      : null,
    companyLogo: currentUser.companyLogo?.dataUrl
      ? {
          dataUrl: currentUser.companyLogo.dataUrl,
          contentType: currentUser.companyLogo.contentType || '',
          fileName: currentUser.companyLogo.fileName || 'logo',
        }
      : null,
    pdfTemplate: currentUser.pdfTemplate || 'classic',
  });

  const [signatureError, setSignatureError] = useState('');
  const [logoError, setLogoError] = useState('');

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

  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(
        file.type.toLowerCase()
      )
    ) {
      setSignatureError('Signature must be PNG, JPG, JPEG, or WEBP.');
      return;
    }

    if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
      setSignatureError('Signature must be 1 MB or smaller.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSignatureError('');
      setFormData((prev) => ({
        ...prev,
        signature: {
          dataUrl: String(reader.result || ''),
          contentType: file.type,
          fileName: file.name,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setSignatureError('');
    setFormData((prev) => ({
      ...prev,
      signature: null,
    }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(
        file.type.toLowerCase()
      )
    ) {
      setLogoError('Logo must be PNG, JPG, JPEG, or WEBP.');
      return;
    }

    if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
      setLogoError('Logo must be 1 MB or smaller.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setLogoError('');
      setFormData((prev) => ({
        ...prev,
        companyLogo: {
          dataUrl: String(reader.result || ''),
          contentType: file.type,
          fileName: file.name,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoError('');
    setFormData((prev) => ({
      ...prev,
      companyLogo: null,
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
        }),
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
                      event.target.value,
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
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* ===== COMPANY LOGO ===== */}
              <div className='profile-grid-full'>
                <label className='form-label'>Company Logo</label>
                <input
                  className='form-input'
                  type='file'
                  accept='image/png,image/jpeg,image/jpg,image/webp'
                  onChange={handleLogoUpload}
                />
                <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
                  Upload your company logo (PNG, JPG, max 1 MB). It will be embedded in PDF documents according to the selected template.
                </p>
                {logoError ? <p style={{ color: 'red' }}>Error: {logoError}</p> : null}
                {formData.companyLogo?.dataUrl ? (
                  <div className='profile-signature-preview'>
                    <img
                      src={formData.companyLogo.dataUrl}
                      alt='Company logo preview'
                      className='profile-signature-image'
                      style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }}
                    />
                    <div className='form-actions'>
                      <button
                        type='button'
                        className='remove-btn'
                        onClick={handleRemoveLogo}
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#888', fontSize: '0.85rem' }}>No logo uploaded yet.</p>
                )}
              </div>

              {/* ===== PDF TEMPLATE ===== */}
              <div className='profile-grid-full'>
                <label className='form-label'>PDF Template</label>
                <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px' }}>
                  Choose the layout style for all generated PDFs (invoices, quotations, proforma, challans, purchase orders).
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        flex: '1 1 160px',
                        border: `2px solid ${formData.pdfTemplate === opt.value ? '#1a56db' : '#d1d5db'}`,
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        background: formData.pdfTemplate === opt.value ? '#eff6ff' : '#fff',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type='radio'
                        name='pdfTemplate'
                        value={opt.value}
                        checked={formData.pdfTemplate === opt.value}
                        onChange={() => handleChange(null, 'pdfTemplate', opt.value)}
                        style={{ marginRight: '8px' }}
                      />
                      <strong style={{ color: formData.pdfTemplate === opt.value ? '#1a56db' : '#374151' }}>
                        {opt.label}
                      </strong>
                      <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '4px', marginLeft: '20px' }}>
                        {opt.description}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* ===== SIGNATURE ===== */}
              <div className='profile-grid-full'>
                <label className='form-label'>Authorized Signature</label>
                <input
                  className='form-input'
                  type='file'
                  accept='image/png,image/jpeg,image/jpg,image/webp'
                  onChange={handleSignatureUpload}
                />
                <p>
                  Upload a clean transparent or white-background signature. This
                  will be used on invoices, quotations, challans, and purchase
                  orders.
                </p>
                {signatureError ? <p>Error: {signatureError}</p> : null}
                {formData.signature?.dataUrl ? (
                  <div className='profile-signature-preview'>
                    <img
                      src={formData.signature.dataUrl}
                      alt='Authorized signature preview'
                      className='profile-signature-image'
                    />
                    <div className='form-actions'>
                      <button
                        type='button'
                        className='remove-btn'
                        onClick={handleRemoveSignature}
                      >
                        Remove Signature
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>No signature uploaded yet.</p>
                )}
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
