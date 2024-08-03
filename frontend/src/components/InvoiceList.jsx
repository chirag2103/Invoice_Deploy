import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import TableHOC from '../components/TableHOC';
import AdminSidebar from './AdminSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices } from '../slices/invoiceSlice';

const InvoiceList = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);
  const { invoices, loading, error } = useSelector((state) => state.invoice);
  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div className='admin-container'>
          <AdminSidebar />
          <main className='invoice-list'>
            <div className='invoice-container'>
              <div>
                <table>
                  <thead>
                    <tr>
                      <td>Invoice No</td>
                      <td>Company</td>
                      <td>Date</td>
                      <td>Amount</td>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNo}</td>
                        <td>{invoice.customer.name}</td>
                        <td>{invoice.date.split('T')[0]}</td>
                        <td>{invoice.grandTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default InvoiceList;
