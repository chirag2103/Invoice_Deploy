import { useEffect, useState } from 'react';
import '../styles/signin.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../slices/userSlice';
import api from '../axiosSetup';

export default function Register() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    companyAddress: '',
    gstin: '',
    mobile: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = (event) => {
    event.preventDefault();

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      companyDetails: {
        name: formData.companyName,
        address: formData.companyAddress,
        gstin: formData.gstin,
        mobile: formData.mobile,
      },
      bankDetails: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
      },
    };

    api
      .post(`${apiUrl}/api/register`, JSON.stringify(userData), {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .then((res) => {
        const token = res.data.token;
        const user = res.data.user;

        dispatch(loginSuccess({ token, user }));
        navigate('/admin/dashboard');
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Registration failed');
      });
  };

  return (
    <div className='main-container'>
      <div className='container auth-container'>
        <div className='auth-panel auth-panel--brand'>
          <p className='auth-eyebrow'>Start Your Workspace</p>
          <h1>Set up your billing workspace with company and bank details.</h1>
          <p className='auth-copy'>
            Create your account once, then generate invoices, quotations,
            challans, and statements from the same system.
          </p>
        </div>
        <form className='form signin auth-panel auth-panel--form' onSubmit={handleRegister}>
          <div className='auth-heading'>
            <h2>Register</h2>
            <p>Create your account and configure the basics for invoicing.</p>
          </div>
          <div className='auth-grid'>
            <div className='inputFields'>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
              />
              <span>name</span>
            </div>
            <div className='inputFields'>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                required
              />
              <span>email</span>
            </div>
            <div className='inputFields'>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                minLength='8'
                required
              />
              <span>password</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='companyName'
                value={formData.companyName}
                onChange={handleChange}
              />
              <span>company name</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='companyAddress'
                value={formData.companyAddress}
                onChange={handleChange}
              />
              <span>company address</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='gstin'
                value={formData.gstin}
                onChange={handleChange}
              />
              <span>gstin</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='mobile'
                value={formData.mobile}
                onChange={handleChange}
              />
              <span>mobile</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='bankName'
                value={formData.bankName}
                onChange={handleChange}
              />
              <span>bank name</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='accountNumber'
                value={formData.accountNumber}
                onChange={handleChange}
              />
              <span>account number</span>
            </div>
            <div className='inputFields'>
              <input
                type='text'
                name='ifsc'
                value={formData.ifsc}
                onChange={handleChange}
              />
              <span>ifsc</span>
            </div>
          </div>
          <div className='inputFields submit-field'>
            <input type='submit' value='Create Account' />
          </div>
          <p className='auth-switch'>
            Already have an account? <Link to='/login'>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
