import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import ProformaInvoiceForm from '../components/ProformaInvoiceForm';

const CreateProformaInvoice = () => {
  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <ProformaInvoiceForm />
      </div>
    </div>
  );
};

export default CreateProformaInvoice;
