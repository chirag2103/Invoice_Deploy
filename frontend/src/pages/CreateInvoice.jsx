import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import InvoiceForm from '../components/InvoiceForm';

const CreateInvoice = () => {
  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <InvoiceForm />
      </div>
    </div>
  );
};

export default CreateInvoice;
