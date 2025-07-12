import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import InvoiceForm from './components/InvoiceForm';
import Print from './components/Print';
import InvoiceList from './components/InvoiceList';
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
import ChallanForm from './components/ChallanForm';
import QuotationForm from './components/QuotationForm';
import CreateQuotation from './pages/CreateQuotation';
import CreateChallan from './pages/CreateChallan';
import ChallanList from './components/ChallanList';
import QuotationList from './components/QuotationList';

import ProtectedRoute from './components/ProtectedRoute';
import PurchaseInvoiceList from './components/PurchaseInvoiceList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<SignIn />} />

        {/* Protected Routes */}
        <Route
          path='/admin/dashboard'
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/transaction'
          element={
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/customers'
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/invoice/new'
          element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/quotation/new'
          element={
            <ProtectedRoute>
              <CreateQuotation />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/challan/new'
          element={
            <ProtectedRoute>
              <CreateChallan />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/payment/new'
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/billinfo'
          element={
            <ProtectedRoute>
              <CustomerBills />
            </ProtectedRoute>
          }
        />

        <Route
          path='/invoices/new'
          element={
            <ProtectedRoute>
              <InvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/quotations/new'
          element={
            <ProtectedRoute>
              <QuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/challans/new'
          element={
            <ProtectedRoute>
              <ChallanForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/statements'
          element={
            <ProtectedRoute>
              <Statement />
            </ProtectedRoute>
          }
        />
        <Route
          path='/statement/:customerId'
          element={
            <ProtectedRoute>
              <CustomerStatement />
            </ProtectedRoute>
          }
        />
        <Route
          path='/invoices/preview'
          element={
            <ProtectedRoute>
              <Print />
            </ProtectedRoute>
          }
        />
        <Route
          path='/invoices/all'
          element={
            <ProtectedRoute>
              <InvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/challans/all'
          element={
            <ProtectedRoute>
              <ChallanList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/quotations/all'
          element={
            <ProtectedRoute>
              <QuotationList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/purchasedBills/all'
          element={
            <ProtectedRoute>
              <PurchaseInvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/customer/:customerId/invoices'
          element={
            <ProtectedRoute>
              <CustomerInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path='/invoices/:invoiceId/edit'
          element={
            <ProtectedRoute>
              <InvoiceForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
