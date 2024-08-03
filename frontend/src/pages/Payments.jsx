import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const Payments = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    console.log('Hello World');
    dispatch(fetchCustomers());
  }, [dispatch]);
  const { loading, error, customers } = useSelector((state) => state.customers);

  const handleCustomerClick = (customerId) => {
    navigate(`/customer/${customerId}/invoices`);
  };

  const [amount, setAmount] = useState();
  const [date, setDate] = useState();
  const [customer, setCustomer] = useState('');

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
  const handleSubmit = (event) => {
    event.preventDefault();
    let paymentData = {
      customer: customer._id,
      amountPaid: amount,
      date: date,
    };
    let paymentDataJSON = JSON.stringify(paymentData);
    axios
      .post('https://invoice-deploy.onrender.com/api/payment/new', paymentDataJSON, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .then((res) => {
        console.log(res);
        alert(res.status + 'Payment added');
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
          <button type='submit' onClick={handleSubmit}>
            Add Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Payments;
