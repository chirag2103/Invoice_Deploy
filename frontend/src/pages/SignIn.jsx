import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../styles/signin.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../slices/userSlice';
import api from '../axiosSetup';
import { getErrorMessage } from '../services/apiError';

export default function SignIn() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  // If we just got bounced here by an expired/invalid session, say why.
  useEffect(() => {
    const message = sessionStorage.getItem('authRedirectMessage');
    if (message) {
      toast.error(message);
      sessionStorage.removeItem('authRedirectMessage');
    }
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();
    setSubmitting(true);
    api
      .post(
        `${apiUrl}/api/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )
      .then((res) => {
        const token = res.data.token;
        const user = res.data.user;

        dispatch(loginSuccess({ token, user }));
        navigate('/admin/dashboard');
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Unable to sign in'));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className='main-container'>
      <div className='container'>
        <div className='auth-panel auth-panel--brand'>
          <p className='auth-eyebrow'>Invoice Management</p>
          <h1>Track invoices, payments, and business records in one place.</h1>
          <p className='auth-copy'>
            Access your dashboard to manage customers, quotations, challans,
            and payment activity with a single account.
          </p>
        </div>
        <form className='form signin auth-panel auth-panel--form' onSubmit={handleLogin}>
          <div className='auth-heading'>
            <h2>Sign In</h2>
            <p>Welcome back. Enter your account details to continue.</p>
          </div>
          <div className='inputFields'>
            <input
              type='email'
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              required
            />
            <span>email</span>
          </div>
          <div className='inputFields'>
            <input
              type='password'
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              required
            />
            <span>password</span>
          </div>
          <div className='inputFields submit-field'>
            <input
              type='submit'
              value={submitting ? 'Signing in...' : 'Sign In'}
              disabled={submitting}
            />
          </div>
          <p className='auth-switch'>
            New here? <Link to='/register'>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
