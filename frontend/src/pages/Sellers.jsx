import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSellers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';
import api from '../axiosSetup.js';

const Sellers = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    // console.log('Hello World');
    dispatch(fetchSellers());
  }, [dispatch]);
  const { sellers } = useSelector((state) => state.customers);

  const handleCustomerClick = (sellerId) => {
    navigate(`/seller/${sellerId}/statement`);
  };

  const [name, setName] = useState('');
  const [gstNo, setgstNo] = useState('');
  const [address, setAddress] = useState('');
  const handleSubmit = (event) => {
    event.preventDefault();
    let userData = {
      name: name,
      gstNo: gstNo,
      address: address,
    };
    let userDataJSON = JSON.stringify(userData);
    api
      .post(`${apiUrl}/api/seller/new`, userDataJSON, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res);
        alert(res.status + 'Customer added');
      })
      .catch((err) => {
        alert(err);
      });
  };
  return (
    <div className='admin-container'>
      {/* AdminSideBar */}
      <AdminSidebar />
      <div className='customer-container'>
        <div className='add-customer'>
          <p>Create Customer</p>
          <form onSubmit={handleSubmit} method='post' className='invoice-form'>
            <label htmlFor='name' className='form-label'>
              Name
            </label>
            <input
              type='text'
              value={name}
              className='form-input'
              onChange={(event) => {
                setName(event.target.value);
              }}
              name='customer'
              id='customer'
            />
            <label htmlFor='gstin' className='form-label'>
              GSTIN:
            </label>

            <input
              type='text'
              name='gstin'
              className='form-input'
              value={gstNo}
              onChange={(event) => {
                setgstNo(event.target.value);
              }}
              id='customer'
            />
            <label htmlFor='adddress' className='form-label'>
              Address:
            </label>
            <input
              type='text'
              name='address'
              className='form-input'
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
              }}
              id='customer'
            />
            <input type='submit' className='add-btn' value='Add' />
          </form>
        </div>
        <div className='customer-list-container'>
          <h1>Select a Customer</h1>
          <div className='customr-list'>
            {sellers.map((customer) => (
              <li
                key={customer._id}
                onClick={() => handleCustomerClick(customer._id)}
              >
                {customer.name}
              </li>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sellers;
