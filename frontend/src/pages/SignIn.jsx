import { useState, useEffect } from 'react';
import '../styles/signin.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../slices/userSlice';
import api from '../axiosSetup';

export default function SignIn() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (event) => {
    event.preventDefault();
    let userData = {
      email: email,
      password: password,
    };
    let userDataJSON = JSON.stringify(userData);
    api
      .post(`${apiUrl}/api/login`, userDataJSON, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .then((res) => {
        // console.log(res);
        const token = res.data.token;
        const user = res.data.user;

        dispatch(loginSuccess({ token, user }));
        navigate('/admin/dashboard');
      })
      .catch((err) => {
        alert(err);
      });
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
            <input type='submit' value='Sign In' />
          </div>
          <p className='auth-switch'>
            New here? <Link to='/register'>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
