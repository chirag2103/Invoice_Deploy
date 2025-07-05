import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import QuotationForm from '../components/QuotationForm';

const CreateQuotation = () => {
  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <QuotationForm />
      </div>
    </div>
  );
};

export default CreateQuotation;
