import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiDashboardFill,
  RiShoppingBag3Fill,
  RiLogoutCircleRLine,
  RiMenuLine,
  RiCloseLine,
} from 'react-icons/ri';
import { IoIosPeople } from 'react-icons/io';
import { AiFillFileText } from 'react-icons/ai';
import { FaChartBar, FaChartPie, FaStopwatch } from 'react-icons/fa';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { useDispatch } from 'react-redux';
import { logout } from '../slices/userSlice';

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const SignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', open);
    return () => document.body.classList.remove('sidebar-open');
  }, [open]);

  return (
    <>
      <button
        type='button'
        className='app-hamburger'
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <RiCloseLine /> : <RiMenuLine />}
      </button>

      <div
        className={`sidebar-overlay ${open ? 'active' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden='true'
      />

      <aside className={open ? 'active' : ''}>
        <div className='sidebar-header'>
          <h2>Logo.</h2>
          <button className='logout-btn' onClick={SignOut}>
            <RiLogoutCircleRLine />
            Logout
          </button>
        </div>
        <div className='sidebar-content'>
          <DivOne location={location} onNavigate={() => setOpen(false)} />
          <DivTwo location={location} onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  );
};

const DivOne = ({ location, onNavigate }) => (
  <div>
    <h5>Dashboard</h5>
    <ul>
      <Li
        url='/admin/dashboard'
        text='Dashboard'
        Icon={RiDashboardFill}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/invoice/new'
        text='Create Invoice'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/quotation/new'
        text='Create Quotation'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/challan/new'
        text='Create Challan'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/proforma/new'
        text='Create Proforma'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/invoices/all'
        text='Invoices'
        Icon={RiShoppingBag3Fill}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/challans/all'
        text='Challans'
        Icon={RiShoppingBag3Fill}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/quotations/all'
        text='Quotations'
        Icon={RiShoppingBag3Fill}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/proformas/all'
        text='Proforma Invoices'
        Icon={RiShoppingBag3Fill}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/customers'
        text='Customer'
        Icon={IoIosPeople}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/transaction'
        text='Transaction'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/payment/new'
        text='Add Payment'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/billinfo'
        text='Billing Info'
        Icon={FaStopwatch}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/statements'
        text='Statements'
        Icon={FaStopwatch}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/profile'
        text='Profile'
        Icon={HiOutlineUserCircle}
        location={location}
        onNavigate={onNavigate}
      />
    </ul>
  </div>
);

const DivTwo = ({ location, onNavigate }) => (
  <div>
    <h5>Purchase</h5>
    <ul>
      <Li
        url='/po/new'
        text='Create Purchase Order'
        Icon={FaChartBar}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/pos/all'
        text='Purchase Orders'
        Icon={FaChartBar}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/purchase/new'
        text='Add Purchase Bill'
        Icon={FaChartBar}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/purchase/payment/new'
        text='Add Purchase Payment'
        Icon={FaChartBar}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/sellers'
        text='Sellers'
        Icon={FaChartPie}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/purchasedBills/all'
        text='Purchased Bills'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/admin/purchasetransaction'
        text='Purchase Transactions'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
      <Li
        url='/purchaseSummary/all'
        text='Purchased Summary'
        Icon={AiFillFileText}
        location={location}
        onNavigate={onNavigate}
      />
    </ul>
  </div>
);

const Li = ({ url, text, location, Icon, onNavigate }) => (
  <li className={location.pathname.includes(url) ? 'active' : ''}>
    <Link to={url} onClick={onNavigate}>
      <Icon />
      {text}
    </Link>
  </li>
);

export default AdminSidebar;
