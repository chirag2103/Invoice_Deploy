import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import InvoiceForm from '../components/InvoiceForm';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/products'),
      ]);
      setCustomers(customersRes.data.customers);
      setProducts(productsRes.data.products);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (invoiceData) => {
    try {
      const response = await axios.post('/api/invoices', invoiceData);
      toast.success('Invoice created successfully');
      navigate(`/invoices/print/${response.data.invoice._id}`);
    } catch (error) {
      toast.error('Error creating invoice');
    }
  };

  if (loading) {
    return (
      <div className='admin-container'>
        <AdminSidebar />
        <main className='p-5'>
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='mb-5'>
          <h2 className='text-2xl font-bold'>Create New Invoice</h2>
        </div>
        <InvoiceForm
          customers={customers}
          products={products}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
};

export default CreateInvoice;
