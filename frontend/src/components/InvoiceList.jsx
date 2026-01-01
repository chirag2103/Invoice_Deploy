import api from '../axiosSetup.js';
import React, { useCallback, useEffect, useState } from 'react';
import TableHOC from '../components/TableHOC';
import AdminSidebar from './AdminSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices } from '../slices/invoiceSlice';
import { useNavigate } from 'react-router-dom';
import { generateInvoicePDF } from '../services/pdfGeneratorService.js';
import { formatNumberWithCommas } from '../services/helper.js';

const InvoiceList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { invoices, loading, error } = useSelector((state) => state.invoice);
  const user = JSON.parse(localStorage.getItem('user'));
  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    dispatch(fetchInvoices());
    // console.log(invoices, loading, error);
  }, [dispatch]);
  const handlePrint = async (invoice, invoicefor) => {
    const data = {
      challanNo: invoice.challanNo ? invoice.challanNo : '',
      gst: invoice.gst,
      invoicefor,
      billNo: invoice.invoiceNo,
      products: invoice.invoiceProducts,
      customer: invoice.customer,
      date: invoice.date.split('T')[0],
      challanDate: invoice.challanDate?.split('T')[0],
      grandTotal: invoice.grandTotal,
      totalAmount: invoice.invoiceTotal,
      orderNo: invoice?.orderNo,
      orderDate: invoice?.orderDate?.split('T')[0],
    };
    console.log('User Details:', user.bankDetails);
    generateInvoicePDF({
      challanNo: invoice.challanNo || '',
      gst: invoice.gst,
      invoicefor: invoicefor,
      billNo: invoice.invoiceNo,
      products: invoice.invoiceProducts,
      customer: invoice.customer,
      date: invoice.date.split('T'),
      challanDate: invoice.challanDate?.split('T'),
      grandTotal: invoice.grandTotal,
      totalAmount: invoice.invoiceTotal,
      orderNo: invoice?.orderNo,
      orderDate: invoice?.orderDate?.split('T'),
      companyName: user.companyDetails.name, // Update with real data
      companyAddress: user.companyDetails.address,
      companyGST: user.companyDetails.gstin,
      companyPhone: user.companyDetails.mobile,
      companyBank: user.bankDetails || {},
    });

    // navigate('/invoices/preview', { state: data });
  };
  const handleOldPrint = async (invoice, invoicefor) => {
    const data = {
      challanNo: invoice.challanNo ? invoice.challanNo : '',
      gst: invoice.gst,
      invoicefor,
      billNo: invoice.invoiceNo,
      products: invoice.invoiceProducts,
      customer: invoice.customer,
      date: invoice.date.split('T')[0],
      challanDate: invoice.challanDate?.split('T')[0],
      grandTotal: invoice.grandTotal,
      totalAmount: invoice.invoiceTotal,
      orderNo: invoice?.orderNo,
      orderDate: invoice?.orderDate?.split('T')[0],
    };
    navigate('/invoices/preview', { state: data });
  };
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
                      <td>Original Print</td>
                      <td>Duplicate Print</td>
                      <td>Old Original Print</td>
                      <td>Old Duplicate Print</td>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNo}</td>
                        <td>{invoice?.customer?.name}</td>
                        <td>{formatDate(invoice.date.split('T')[0])}</td>
                        <td>{formatNumberWithCommas(invoice.grandTotal)}</td>
                        <td>
                          <button
                            onClick={() =>
                              handlePrint(invoice, 'Original Copy')
                            }
                          >
                            Original
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handlePrint(invoice, 'Duplicate Copy')
                            }
                          >
                            Duplicate
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleOldPrint(invoice, 'Original Copy')
                            }
                          >
                            Old Original
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleOldPrint(invoice, 'Duplicate Copy')
                            }
                          >
                            Old Duplicate
                          </button>
                        </td>
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
