import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSellers } from '../slices/customerSlice'; // ✅ make sure you have this slice
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const SellerPayments = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSellers());
  }, [dispatch]);

  const { sellers } = useSelector((state) => state.customers);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [seller, setSeller] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSellerChange = (event) => {
    const selectedSellerId = event.target.value;
    const selectedSellerObject = sellers.find(
      (s) => s._id === selectedSellerId
    );
    setSeller(selectedSellerObject);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = `${apiUrl}/api/purchase/payment/new`; // ✅ seller payments endpoint

    const data = {
      seller: seller._id,
      amountPaid: amount,
      date,
      remarks,
    };

    axios
      .post(url, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        alert('Seller Payment Added');
      })
      .catch((err) => {
        alert('Error: ' + err.message);
      });
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='customer-container'>
        <form className='invoice-form'>
          <div className='form-group'>
            <label htmlFor='seller' className='form-label'>
              Seller:
            </label>
            <select
              id='seller'
              className='form-select'
              value={seller ? seller._id : ''}
              onChange={handleSellerChange}
            >
              <option value=''>Select</option>
              {sellers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className='form-group'>
            <label className='form-label'>Amount</label>
            <input
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='form-input'
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>Date</label>
            <input
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className='form-input'
              style={{ width: '10rem' }}
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>Remarks</label>
            <input
              type='text'
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className='form-input'
            />
          </div>

          <button type='submit' onClick={handleSubmit}>
            Add Seller Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerPayments;
