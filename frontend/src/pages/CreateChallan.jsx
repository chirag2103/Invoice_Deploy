import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import ChallanForm from '../components/ChallanForm';

const CreateChallan = () => {
  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <ChallanForm />
      </div>
    </div>
  );
};

export default CreateChallan;
