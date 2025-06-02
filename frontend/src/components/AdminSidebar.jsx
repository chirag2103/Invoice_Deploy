import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { toast } from 'react-toastify';
import {
  RiDashboardLine,
  RiFileList3Line,
  RiUserLine,
  RiMoneyDollarCircleLine,
  RiFileTextLine,
  RiLogoutBoxLine,
  RiShoppingBag3Line,
  RiFileListLine,
  RiTruckLine,
  RiBuilding4Line,
} from 'react-icons/ri';

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <RiDashboardLine />,
      roles: ['admin', 'manager', 'user'],
    },
    {
      path: '/invoices',
      name: 'Invoices',
      icon: <RiFileList3Line />,
      roles: ['admin', 'manager', 'user'],
    },
    {
      path: '/quotations',
      name: 'Quotations',
      icon: <RiFileTextLine />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/challans',
      name: 'Challans',
      icon: <RiTruckLine />,
      roles: ['admin', 'manager', 'user'],
    },
    {
      path: '/customers',
      name: 'Customers',
      icon: <RiUserLine />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/products',
      name: 'Products',
      icon: <RiShoppingBag3Line />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/payments',
      name: 'Payments',
      icon: <RiMoneyDollarCircleLine />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/statements',
      name: 'Statements',
      icon: <RiFileListLine />,
      roles: ['admin'],
    },
  ];

  return (
    <aside className='admin-sidebar'>
      <div className='sidebar-header'>
        <div className='logo-container'>
          <RiBuilding4Line />
          <h2>Invoice Manager</h2>
        </div>
        <div className='user-info'>
          <p>Welcome,</p>
          <p>{user?.name}</p>
          <p>{user?.role}</p>
        </div>
      </div>

      <nav className='sidebar-nav'>
        <ul>
          {menuItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={isActive(item.path) ? 'active' : ''}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      <div className='sidebar-footer'>
        <button onClick={handleLogout}>
          <RiLogoutBoxLine />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
