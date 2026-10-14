import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

const InvoiceForm = lazy(() => import('./components/InvoiceForm'));
const Print = lazy(() => import('./components/Print'));
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transaction = lazy(() => import('./pages/Transaction'));
const CustomerInvoices = lazy(() => import('./pages/CustomerInvoices'));
const Customers = lazy(() => import('./pages/Customers'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const Payments = lazy(() => import('./pages/Payments'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Register = lazy(() => import('./pages/Register'));
const CustomerBills = lazy(() => import('./pages/CustomerBills'));
const Statement = lazy(() => import('./pages/Statement'));
const CustomerStatement = lazy(() => import('./pages/CustomerStatement'));
const ChallanForm = lazy(() => import('./components/ChallanForm'));
const QuotationForm = lazy(() => import('./components/QuotationForm'));
const CreateQuotation = lazy(() => import('./pages/CreateQuotation'));
const CreateChallan = lazy(() => import('./pages/CreateChallan'));
const ChallanList = lazy(() => import('./components/ChallanList'));
const QuotationList = lazy(() => import('./components/QuotationList'));

const PurchaseInvoiceList = lazy(() => import('./components/PurchaseInvoiceList'));
const PurchaseSummary = lazy(() => import('./pages/PurchaseSummary'));
const PurchaseForm = lazy(() => import('./pages/PurchaseForm'));
const Sellers = lazy(() => import('./pages/Sellers'));
const SellerStatement = lazy(() => import('./pages/SellerStatement'));
const SellerPayments = lazy(() => import('./pages/sellerPayments'));
const PurchaseTransaction = lazy(() => import('./pages/PurchaseTransactions'));
const PurchaseOrderForm = lazy(() => import('./components/PurchaseOrderForm'));
const PurchaseOrderList = lazy(() => import('./components/PurchaseOrderList'));
const ProformaInvoiceForm = lazy(() => import('./components/ProformaInvoiceForm'));
const ProformaInvoiceList = lazy(() => import('./components/ProformaInvoiceList'));
const CreateProformaInvoice = lazy(() => import('./pages/CreateProformaInvoice'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Router>
      <Toaster position='top-right' toastOptions={{ duration: 4000 }} />
      <Suspense fallback={<PageLoader />}>
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
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
