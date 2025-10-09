import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';
import api from '../axiosSetup.js';

const Payments = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    // console.log('Hello World');
    dispatch(fetchCustomers());
  }, [dispatch]);
  const { loading, error, customers } = useSelector((state) => state.customers);

  const [amount, setAmount] = useState();
  const [date, setDate] = useState();
  const [customer, setCustomer] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleCustomerChange = async (event) => {
    const selectedCustomerId = event.target.value;
    const selectedCustomerObject = await customers.find(
      (customer) => customer._id === selectedCustomerId
    );
    setCustomer(selectedCustomerObject);
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };
  const handleRemarksChange = (event) => {
    setRemarks(event.target.value);
  };

  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   let paymentData = {
  //     customer: customer._id,
  //     amountPaid: amount,
  //     date: date,
  //     remarks: remarks,
  //   };
  //   let paymentDataJSON = JSON.stringify(paymentData);
  //   api
  //     .post(`${apiUrl}/api/payment/new`, paymentDataJSON, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Accept: 'application/json',
  //         Authorization: `Bearer ${token}`,
  //       },
  //     })
  //     .then((res) => {
  //       // console.log(res);
  //       alert(res.status + 'Payment added');
  //     })
  //     .catch((err) => {
  //       alert(err);
  //     });
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log(seller, purchaseAmount, purchaseDate);

    const url = `${apiUrl}/api/payment/new`;

    const data = {
      customer: customer._id,
      amountPaid: amount,
      date,
      remarks,
    };

    api
      .post(url, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        alert('Payment Added');
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
        {/* <form className='invoice-form'>
          <div className='form-group'>
            <label htmlFor='customer' className='form-label'>
              Customer:
            </label>
            <select
              id='customer'
              className='form-select'
              value={customer ? customer._id : ''}
              onChange={handleCustomerChange}
              aria-required
            >
              <option value=''>select</option>
              {loading ? (
                <option value=''>Loading...</option>
              ) : error ? (
                <option value=''>Error: {error}</option>
              ) : (
                customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className='form-group'>
            <label htmlFor='billNo' className='form-label'>
              Amount
            </label>
            <input
              type='number'
              id='amountNo'
              className='form-input'
              value={amount}
              onChange={handleAmountChange}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='date' className='form-label'>
              Date:
            </label>
            <input
              type='date'
              placeholder={date}
              id='date'
              className='form-input'
              value={date}
              onChange={handleDateChange}
              style={{ width: '10rem' }}
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='remarks' className='form-label'>
              Remarks
            </label>
            <input
              type='text'
              id='remarks'
              className='form-input'
              value={remarks}
              onChange={handleRemarksChange}
            />
          </div>
          <button type='submit' onClick={handleSubmit}>
            Add Payment
          </button>
        </form> */}

        <form className='invoice-form'>
          <div className='form-group'>
            <label htmlFor='customer' className='form-label'>
              Customer:
            </label>
            <select
              id='customer'
              className='form-select'
              value={customer ? customer._id : ''}
              onChange={handleCustomerChange}
            >
              <option value=''>Select</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className='form-group'>
            <label className='form-label'>Amount</label>
            <input
              type='number'
              value={amount}
              onChange={handleAmountChange}
              className='form-input'
            />
          </div>
          <div className='form-group'>
            <label className='form-label'>Date</label>
            <input
              type='date'
              value={date}
              onChange={handleDateChange}
              className='form-input'
              style={{ width: '10rem' }}
            />
          </div>
          <div className='form-group'>
            <label className='form-label'>Remarks</label>
            <input
              type='text'
              value={remarks}
              onChange={handleRemarksChange}
              className='form-input'
            />
          </div>

          <button type='submit' onClick={handleSubmit}>
            Add Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Payments;
