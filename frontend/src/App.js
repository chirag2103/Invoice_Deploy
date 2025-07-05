import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvoiceForm from './components/InvoiceForm'; // Replace with your path
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<SignIn />} />
        <Route path='/invoices/new' element={<InvoiceForm />} />
        <Route path='/quotations/new' element={<QuotationForm />} />
        <Route path='/challans/new' element={<ChallanForm />} />
        <Route path='/statements' element={<Statement />} />
        <Route path='/statement/:customerId' element={<CustomerStatement />} />
        <Route path='/invoices/preview' element={<Print />} />
        <Route path='/invoices/all' element={<InvoiceList />} />
        <Route path='/challans/all' element={<ChallanList />} />
        <Route path='/quotations/all' element={<QuotationList />} />
        <Route path='/admin/transaction' element={<Transaction />} />
        <Route path='/admin/dashboard' element={<Dashboard />} />
        <Route path='/admin/customers' element={<Customers />} />
        <Route path='/admin/billinfo' element={<CustomerBills />} />
        <Route path='/admin/invoice/new' element={<CreateInvoice />} />
        <Route path='/admin/quotation/new' element={<CreateQuotation />} />
        <Route path='/admin/challan/new' element={<CreateChallan />} />
        <Route path='/admin/payment/new' element={<Payments />} />
        <Route
          path='/customer/:customerId/invoices'
          element={<CustomerInvoices />}
        />
        <Route path='/invoices/:invoiceId/edit' element={<InvoiceForm />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;
