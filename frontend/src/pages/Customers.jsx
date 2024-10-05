// import { BsSearch } from 'react-icons/bs';
// import AdminSidebar from '../components/AdminSidebar';
// import { BarChart1, LineChart, PieChart } from '../components/Charts';
// import { FaRegBell } from 'react-icons/fa';
// import userImg from '../assets/userpic.png';
// const Customers = () => {
//   const months = [
//     'January',
//     'February',
//     'March',
//     'April',
//     'May',
//     'June',
//     'July',
//     'Aug',
//     'Sept',
//     'Oct',
//     'Nov',
//     'Dec',
//   ];
//   return (
//     <div className='admin-container'>
//       <AdminSidebar />
//       <section className='customer'>
//         <div className='bar'>
//           <BsSearch />
//           <input type='text' placeholder='Search for data,users,docs' />
//           <FaRegBell />
//           <img src={userImg} alt='User' />
//         </div>
//         <div className='pie-container'>
//           <div className='pie-chart'>
//             <h2>Ports (Open/Closed)</h2>
//             <PieChart
//               labels={['Open Ports', 'Closed Ports']}
//               label={'No of Ports'}
//               data={[12, 19]}
//               backgroundColor={[
//                 'rgba(255, 99, 132, 0.2)',
//                 'rgba(54, 162, 235, 0.2)',
//               ]}
//               borderColor={['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)']}
//               borderWidth={1}
//             />
//           </div>
//           <div className='bar1-chart'>
//             <h2>Events & Count</h2>
//             <BarChart1
//               data_1={[200, 444, 343, 556, 778, 455, 990]}
//               title_1='Events'
//               bgColor_1='rgb(0,115,255)'
//             />
//             {/* Graph */}
//           </div>
//         </div>
//         <div className='line-container'>
//           <div className='line-chart'>
//             <h2>No. of IP Address</h2>
//             <LineChart
//               data={[
//                 200, 444, 444, 556, 778, 455, 990, 1444, 256, 447, 1000, 1200,
//               ]}
//               label='Users'
//               borderColor='rgb(53, 162, 255)'
//               backgroundColor='rgba(53, 162, 255,0.5)'
//               labels={months}
//             />
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Customers;

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../slices/customerSlice';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const Customers = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    console.log('Hello World');
    dispatch(fetchCustomers());
  }, [dispatch]);
  const { customers } = useSelector((state) => state.customers);

  const handleCustomerClick = (customerId) => {
    navigate(`/customer/${customerId}/invoices`);
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
    axios
      .post(`${apiUrl}/api/customer/new`, userDataJSON, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .then((res) => {
        console.log(res);
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

export default Customers;
