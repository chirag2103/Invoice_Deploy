import React, { useEffect, useState } from 'react';
import api from '../axiosSetup.js';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';
import { getTodayDate } from '../services/helper.js';
import '../styles/InvoiceForm.css';

const PurchaseForm = () => {
  //   const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(getTodayDate);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [invoiceNO, setInvoiceNO] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  const dispatch = useDispatch();
  useEffect(() => {
    // console.log('Hello World');
    dispatch(fetchSellers());
  }, [dispatch]);
  const { sellers } = useSelector((state) => state.customers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post(
        `${apiUrl}/api/purchase/new`,
        {
          seller: selectedSeller,
          date: invoiceDate,
          amount: Number(amount),
          invoiceNo: invoiceNO,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage('Purchase invoice added successfully!');
      setSelectedSeller('');
      setInvoiceDate('');
      setAmount('');
    } catch (err) {
      console.error('Error creating invoice:', err);
      setMessage('Failed to create purchase invoice.');
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <div className='invoice-container'>
          <h2 className='invoice-header'>Create Purchase Invoice</h2>
          {message && <p className='no-products'>{message}</p>}
          <form className='invoice-form' onSubmit={handleSubmit}>
          {/* Seller Dropdown */}

          <div className='form-group'>
            <label className='form-label' htmlFor='seller'>
              Select Seller
            </label>
            <select
              id='seller'
              className='form-select'
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              required
            >
              <option value=''>-- Select Seller --</option>
              {sellers.map((seller) => {
                // console.log(seller);
                return (
                  <option key={seller._id} value={seller._id}>
                    {seller.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Invoice Number */}
          <div className='form-group'>
            <label className='form-label' htmlFor='invoiceNo'>
              Invoice Number
            </label>
            <input
              type='text'
              className='form-input'
              id='invoiceNo'
              value={invoiceNO}
              onChange={(e) => setInvoiceNO(e.target.value)}
              required
            />
          </div>

          {/* Invoice Date */}
          <div className='form-group'>
            <label className='form-label' htmlFor='date'>
              Invoice Date
            </label>
            <input
              type='date'
              className='form-input'
              id='date'
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className='form-group'>
            <label className='form-label' htmlFor='amount'>
              Amount
            </label>
            <input
              type='number'
              className='form-input'
              id='amount'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className='form-actions'>
            <button type='submit' className='save-btn'>
              Add Purchase Invoice
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
