import AdminSidebar from '../components/AdminSidebar';
import userImg from '../assets/userpic.png';
import { BsSearch } from 'react-icons/bs';
import { FaRegBell } from 'react-icons/fa';
import { BarChart1 } from '../components/Charts';

const Products = () => {
  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='products'>
        <div className='bar'>
          <BsSearch />
          <input type='text' placeholder='Search for data, users, docs' />
          <FaRegBell />
          <img src={userImg} alt='User' />
        </div>
        <div className='bar-container'>
          <div className='bar1-chart'>
            <h2>Security Incidents</h2>
            <BarChart1
              data_1={[100, 200, 150, 300, 250, 400, 350]} // Updated security events data
              title_1='Security Incidents' // Updated title for security events
              bgColor_1='rgb(255, 99, 132)' // Updated background color
            />
          </div>
          <div className='bar1-chart'>
            <h2>Security Warnings</h2>
            <BarChart1
              data_1={[50, 100, 75, 150, 125, 200, 175]} // Updated security alerts data
              title_1='Security Warnings' // Updated title for security alerts
              bgColor_1='rgb(54, 162, 235)' // Updated background color
            />
          </div>
        </div>
        <div className='bar-container'>
          <div className='bar1-chart'>
            <h2>Access Violations</h2>
            <BarChart1
              data_1={[20, 40, 30, 60, 50, 80, 70]} // Updated unauthorized access attempts data
              title_1='Access Violations' // Updated title for unauthorized access attempts
              bgColor_1='rgb(255, 205, 86)' // Updated background color
            />
          </div>
          <div className='bar1-chart'>
            <h2>Network Attacks</h2>
            <BarChart1
              data_1={[10, 20, 15, 30, 25, 40, 35]} // Updated DDoS attacks data
              title_1='Network Attacks' // Updated title for DDoS attacks
              bgColor_1='rgb(75, 192, 192)' // Updated background color
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products;
