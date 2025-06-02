import { FaRegBell } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices } from '../slices/invoiceSlice';
import userImg from '../assets/userpic.png';
import BarChart from '../components/Charts/BarChart';
import DoughnutChart from '../components/Charts/DoughnutChart';
import Table from '../components/DashboardTable';
import api from '../utils/axios';
import {
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiFileTextLine,
  RiTruckLine,
} from 'react-icons/ri';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalQuotations: 0,
    totalChallans: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    recentInvoices: [],
    recentQuotations: [],
    recentChallans: [],
  });

  useEffect(() => {
    dispatch(fetchInvoices());
    fetchDashboardStats();
  }, [dispatch]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const StatCard = ({ title, value, icon, trend, color }) => (
    <div className='bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300'>
      <div className='flex items-center justify-between mb-4'>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        {trend && (
          <div
            className={`flex items-center ${
              trend > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend > 0 ? <HiTrendingUp /> : <HiTrendingDown />}
            <span className='ml-1 text-sm'>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className='text-gray-500 text-sm mb-1'>{title}</h3>
      <p className='text-2xl font-bold text-gray-800'>{value}</p>
    </div>
  );

  const WidgetItem = ({ heading, value, percent, color, amount = false }) => (
    <article className='widget'>
      <div className='widget-info'>
        <p>{heading}</p>
        <h4>{amount ? `₹${value}` : value}</h4>
        {percent > 0 ? (
          <span className='green'>
            <HiTrendingUp /> +{percent}%
          </span>
        ) : (
          <span className='red'>
            <HiTrendingDown /> {percent}%
          </span>
        )}
      </div>
      <div
        className='widget-circle'
        style={{
          background: `conic-gradient(
            ${color} ${(Math.abs(percent) / 100) * 360}deg,
            rgb(255, 255, 255) 0
          )`,
        }}
      >
        <span style={{ color }}>{percent}%</span>
      </div>
    </article>
  );

  const CategoryItem = ({ color, value, heading }) => (
    <div className='category-item'>
      <h5>{heading}</h5>
      <div>
        <div style={{ backgroundColor: color, width: `${value}%` }} />
      </div>
      <p>{value}%</p>
    </div>
  );

  return (
    <div className='dashboard'>
      <div className='bar'>
        <div className='search-container'>
          <BsSearch />
          <input type='text' placeholder='Search...' />
        </div>
        <div className='user-section'>
          <button className='notification-btn'>
            <FaRegBell />
          </button>
          <div className='user-profile'>
            <img src={userImg} alt='User' />
            <span>{user?.name}</span>
          </div>
        </div>
      </div>

      <div className='widget-container'>
        <div className='widget'>
          <div className='widget-header'>
            <div className='widget-icon revenue'>
              <RiMoneyDollarCircleLine />
            </div>
            <div className='trend up'>
              <HiTrendingUp />
              <span>12%</span>
            </div>
          </div>
          <div className='widget-content'>
            <h3>Total Revenue</h3>
            <p>₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className='widget'>
          <div className='widget-header'>
            <div className='widget-icon invoices'>
              <RiFileList3Line />
            </div>
            <div className='trend up'>
              <HiTrendingUp />
              <span>8%</span>
            </div>
          </div>
          <div className='widget-content'>
            <h3>Total Invoices</h3>
            <p>{stats.totalInvoices}</p>
          </div>
        </div>

        <div className='widget'>
          <div className='widget-header'>
            <div className='widget-icon quotations'>
              <RiFileTextLine />
            </div>
            <div className='trend down'>
              <HiTrendingDown />
              <span>5%</span>
            </div>
          </div>
          <div className='widget-content'>
            <h3>Total Quotations</h3>
            <p>{stats.totalQuotations}</p>
          </div>
        </div>

        <div className='widget'>
          <div className='widget-header'>
            <div className='widget-icon challans'>
              <RiTruckLine />
            </div>
            <div className='trend up'>
              <HiTrendingUp />
              <span>15%</span>
            </div>
          </div>
          <div className='widget-content'>
            <h3>Total Challans</h3>
            <p>{stats.totalChallans}</p>
          </div>
        </div>
      </div>

      <div className='charts-container'>
        <div className='chart-box'>
          <h2>Document Statistics</h2>
          <BarChart
            data={[
              stats.totalInvoices,
              stats.totalQuotations,
              stats.totalChallans,
            ]}
            labels={['Invoices', 'Quotations', 'Challans']}
            backgroundColor={[
              'rgba(59, 130, 246, 0.5)', // Blue
              'rgba(147, 51, 234, 0.5)', // Purple
              'rgba(249, 115, 22, 0.5)', // Orange
            ]}
            borderColor={[
              'rgb(59, 130, 246)',
              'rgb(147, 51, 234)',
              'rgb(249, 115, 22)',
            ]}
          />
        </div>
        <div className='chart-box'>
          <h2>Payment Distribution</h2>
          <DoughnutChart
            labels={['Paid', 'Pending', 'Overdue']}
            data={[stats.totalPaid, stats.totalPending, stats.totalOverdue]}
            backgroundColor={[
              'rgba(34, 197, 94, 0.5)', // Green
              'rgba(234, 179, 8, 0.5)', // Yellow
              'rgba(239, 68, 68, 0.5)', // Red
            ]}
            borderColor={[
              'rgb(34, 197, 94)',
              'rgb(234, 179, 8)',
              'rgb(239, 68, 68)',
            ]}
            cutout={70}
          />
        </div>
      </div>

      <div className='tables-container'>
        <div className='table-box'>
          <div className='table-header'>
            <h2>Recent Invoices</h2>
            <button>View All</button>
          </div>
          <div className='table-content'>
            <Table data={stats.recentInvoices} type='invoice' />
          </div>
        </div>
        <div className='table-box'>
          <div className='table-header'>
            <h2>Recent Quotations</h2>
            <button>View All</button>
          </div>
          <div className='table-content'>
            <Table data={stats.recentQuotations} type='quotation' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
