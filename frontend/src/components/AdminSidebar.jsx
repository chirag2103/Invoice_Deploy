import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiDashboardFill,
  RiShoppingBag3Fill,
  RiLogoutCircleRLine,
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

  const SignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <>
      <aside>
        <div className='sidebar-header'>
          <h2>Logo.</h2>
          <button className='logout-btn' onClick={SignOut}>
            <RiLogoutCircleRLine />
            Logout
          </button>
        </div>
        <div className='sidebar-content'>
          <DivOne location={location} />
          <DivTwo location={location} />
          {/* <DivThree location={location} /> */}
        </div>
      </aside>
    </>
  );
};

const DivOne = ({ location }) => (
  <div>
    <h5>Dashboard</h5>
    <ul>
      <Li
        url='/admin/dashboard'
        text='Dashboard'
        Icon={RiDashboardFill}
        location={location}
      />
      <Li
        url='/admin/invoice/new'
        text='Create Invoice'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/admin/quotation/new'
        text='Create Quotation'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/admin/challan/new'
        text='Create Challan'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/invoices/all'
        text='Invoices'
        Icon={RiShoppingBag3Fill}
        location={location}
      />
      <Li
        url='/challans/all'
        text='Challans'
        Icon={RiShoppingBag3Fill}
        location={location}
      />
      <Li
        url='/quotations/all'
        text='Quotations'
        Icon={RiShoppingBag3Fill}
        location={location}
      />
      <Li
        url='/admin/customers'
        text='Customer'
        Icon={IoIosPeople}
        location={location}
      />
      <Li
        url='/admin/transaction'
        text='Transaction'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/admin/payment/new'
        text='Add Payment'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/admin/billinfo'
        text='Billing Info'
        Icon={FaStopwatch}
        location={location}
      />
      <Li
        url='/statements'
        text='Statements'
        Icon={FaStopwatch}
        location={location}
      />
      <Li
        url='/admin/profile'
        text='Profile'
        Icon={HiOutlineUserCircle}
        location={location}
      />
    </ul>
  </div>
);

const DivTwo = ({ location }) => (
  <div>
    <h5>Purchase</h5>
    <ul>
      <Li
        url='/po/new'
        text='Create Purchase Order'
        Icon={FaChartBar}
        location={location}
      />
      <Li
        url='/pos/all'
        text='Purchase Orders'
        Icon={FaChartBar}
        location={location}
      />
      <Li
        url='/purchase/new'
        text='Add Purchase Bill'
        Icon={FaChartBar}
        location={location}
      />
      <Li
        url='/purchase/payment/new'
        text='Add Purchase Payment'
        Icon={FaChartBar}
        location={location}
      />
      <Li url='/sellers' text='Sellers' Icon={FaChartPie} location={location} />
      <Li
        url='/purchasedBills/all'
        text='Purchased Bills'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/admin/purchasetransaction'
        text='Purchase Transactions'
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url='/purchaseSummary/all'
        text='Purchased Summary'
        Icon={AiFillFileText}
        location={location}
      />
    </ul>
  </div>
);

const Li = ({ url, text, location, Icon }) => (
  <li className={location.pathname.includes(url) ? 'active' : ''}>
    <Link to={url}>
      <Icon />
      {text}
    </Link>
  </li>
);

export default AdminSidebar;
