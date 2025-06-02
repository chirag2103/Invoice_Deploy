import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, logout, setInitialized } from './slices/authSlice';
import { setLogoutCallback } from './utils/axios';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from './components/AdminSidebar';
import QuotationList from './components/QuotationList';
import QuotationForm from './components/QuotationForm';
import ChallanList from './components/ChallanList';
import ChallanForm from './components/ChallanForm';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import Print from './components/Print';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROLES } from './config/roles';
import Dashboard from './pages/Dashboard';
import Transaction from './pages/Transaction';
import CustomerInvoices from './pages/CustomerInvoices';
import Customers from './pages/Customers';
import CreateInvoice from './pages/CreateInvoice';
import Payments from './pages/Payments';
import SignIn from './pages/SignIn';
import CustomerBills from './pages/CustomerBills';
import Statement from './pages/Statement';
import CustomerStatement from './pages/CustomerStatement';
import './styles/app.scss';

const AppContent = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, initialized } = useSelector((state) => state.auth);
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(
    location.pathname
  );

  useEffect(() => {
    // Set up logout callback
    setLogoutCallback(() => {
      dispatch(logout());
    });

    // Initial auth check
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await dispatch(getCurrentUser());
      } else {
        dispatch(setInitialized());
      }
    };
    initAuth();
  }, [dispatch]);

  if (!initialized || loading) {
    return (
      <div className='loader'>
        <div className='loader-spinner'></div>
      </div>
    );
  }

  return (
    <div
      className={
        isAuthPage ? 'min-h-screen bg-gray-50' : 'flex min-h-screen bg-gray-50'
      }
    >
      {!isAuthPage && <AdminSidebar />}
      <main className={isAuthPage ? 'w-full' : 'flex-1 ml-64'}>
        <Routes>
          {/* Dashboard Route */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Invoice Routes */}
          <Route
            path='/invoices'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <InvoiceList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/invoices/new'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <InvoiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path='/invoices/edit/:id'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <InvoiceForm isEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path='/invoices/print/:id'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <Print />
              </ProtectedRoute>
            }
          />

          {/* Quotation Routes */}
          <Route
            path='/quotations'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <QuotationList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/quotations/new'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <QuotationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path='/quotations/edit/:id'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <QuotationForm isEdit />
              </ProtectedRoute>
            }
          />

          {/* Challan Routes */}
          <Route
            path='/challans'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <ChallanList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/challans/new'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <ChallanForm />
              </ProtectedRoute>
            }
          />
          <Route
            path='/challans/edit/:id'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]}>
                <ChallanForm isEdit />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path='/admin/transaction'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Transaction />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/dashboard'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/customers'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/billinfo'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <CustomerBills />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/invoice/new'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <CreateInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/payment/new'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Payments />
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path='/customer/:customerId/invoices'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CustomerInvoices />
              </ProtectedRoute>
            }
          />

          {/* SignIn Route */}
          <Route path='/' element={<SignIn />} />

          {/* Statements Route */}
          <Route
            path='/statements'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Statement />
              </ProtectedRoute>
            }
          />
          <Route
            path='/statement/:customerId'
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CustomerStatement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <ToastContainer position='bottom-right' />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
