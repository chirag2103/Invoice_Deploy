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
import Register from './pages/Register';
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
import PurchaseSummary from './pages/PurchaseSummary';
import PurchaseForm from './pages/PurchaseForm';
import Sellers from './pages/Sellers';
import SellerStatement from './pages/SellerStatement';
import SellerPayments from './pages/sellerPayments';
import PurchaseTransaction from './pages/PurchaseTransactions';
import PurchaseOrderForm from './components/PurchaseOrderForm';
import PurchaseOrderList from './components/PurchaseOrderList';
import ProformaInvoiceForm from './components/ProformaInvoiceForm';
import ProformaInvoiceList from './components/ProformaInvoiceList';
import CreateProformaInvoice from './pages/CreateProformaInvoice';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<SignIn />} />
        <Route path='/login' element={<SignIn />} />
        <Route path='/register' element={<Register />} />

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
          path='/admin/purchasetransaction'
          element={
            <ProtectedRoute>
              <PurchaseTransaction />
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
          path='/admin/profile'
          element={
            <ProtectedRoute>
              <Profile />
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
          path='/purchase/new'
          element={
            <ProtectedRoute>
              <PurchaseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/sellers'
          element={
            <ProtectedRoute>
              <Sellers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/purchase/payment/new'
          element={
            <ProtectedRoute>
              <SellerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path='/seller/:sellerId/statement'
          element={
            <ProtectedRoute>
              <SellerStatement />
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
          path='/po/new'
          element={
            <ProtectedRoute>
              <PurchaseOrderForm />
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
          path='/pos/all'
          element={
            <ProtectedRoute>
              <PurchaseOrderList />
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
          path='/purchaseSummary/all'
          element={
            <ProtectedRoute>
              <PurchaseSummary />
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
        <Route
          path='/quotations/:quotationId/edit'
          element={
            <ProtectedRoute>
              <QuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/po/:poId/edit'
          element={
            <ProtectedRoute>
              <PurchaseOrderForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/proforma/new'
          element={
            <ProtectedRoute>
              <CreateProformaInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path='/proformas/new'
          element={
            <ProtectedRoute>
              <ProformaInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path='/proformas/all'
          element={
            <ProtectedRoute>
              <ProformaInvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/proformas/:proformaId/edit'
          element={
            <ProtectedRoute>
              <ProformaInvoiceForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
