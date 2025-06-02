import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, clearError } from '../slices/authSlice';
import { toast } from 'react-toastify';
import '../styles/signin.scss';

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, error, loading } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to the attempted URL or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) {
      return; // Prevent multiple submissions while loading
    }

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
    } catch (err) {
      // Error is already handled by the error useEffect
      console.error('Login failed:', err);
    }
  };

  return (
    <div className='main-container'>
      <div className='container'>
        <form className='form' onSubmit={handleSubmit}>
          <h2>Sign In</h2>
          <div className='inputFields'>
            <input
              type='email'
              name='email'
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Email</span>
          </div>
          <div className='inputFields'>
            <input
              type='password'
              name='password'
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Password</span>
          </div>
          <div className='inputFields'>
            <input
              type='submit'
              value={loading ? 'Signing in...' : 'Sign in'}
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
