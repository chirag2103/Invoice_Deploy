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
    <>
      <div className='main-container'>
        <div className='container'>
          <form action='' className='form signin' onSubmit={handleLogin}>
            <h2>Sign In</h2>
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
            <div className='inputFields'>
              <input type='submit' />
            </div>
            <p>
              New here? <Link to='/register'>Create an account</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
