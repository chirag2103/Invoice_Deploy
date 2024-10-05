import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';

const Statement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    console.log('Hello World');
    dispatch(fetchCustomers());
  }, [dispatch]);
  const { customers } = useSelector((state) => state.customers);

  const handleCustomerClick = (customerId) => {
    navigate(`/statement/${customerId}`);
  };

  return (
    <div className='admin-container'>
      {/* AdminSideBar */}
      <AdminSidebar />
      <div className='customer-container'>
        <div className='customer-list-container'>
          <h1>Select a Customer</h1>
          <div className='customr-list'>
            {customers.map((customer) => (
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

export default Statement;
