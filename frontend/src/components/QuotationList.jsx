import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';

import { fetchQuotations } from '../slices/quotationSlice';
import { generateQuotationPDF } from '../services/pdfGeneratorService';
import { formatNumberWithCommas } from '../services/helper';

const QuotationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { quotations, loading, error } = useSelector(
    (state) => state.quotation
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  // Fetch quotations
  useEffect(() => {
    dispatch(fetchQuotations());
  }, [dispatch]);

  // ---------------------------------------------------------
  // PRINT PDF DIRECTLY
  // ---------------------------------------------------------
  const handlePrint = (quotation) => {
    const pdfData = {
      customer: quotation.customer,
      quotationNo: quotation.quoteNo,
      date: quotation.date.split('T')[0],
      products: quotation.quotationProducts,
      gst: quotation.gst,
      totalAmount: quotation.invoiceTotal,
      grandTotal: quotation.grandTotal,
      technicalSpecifications: quotation.technicalSpecifications || [],
      termsAndConditions: quotation.termsAndConditions || [],

      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
    };

    generateQuotationPDF(pdfData);
  };

  // ---------------------------------------------------------
  // Convert To Invoice
  // ---------------------------------------------------------
  const handleConvertToInvoice = (quotation) => {
    navigate('/admin/invoice/new', {
      state: { fromQuotation: true, quotation },
    });
  };

  // ---------------------------------------------------------
  // Edit Quotation
  // ---------------------------------------------------------
  const handleEditQuotation = (quotation) => {
    navigate(`/quotations/${quotation._id}/edit`, {
      state: { quotation },
    });
  };
  const handleOldPrint = (quotation) => {
    const data = {
      gst: quotation.gst,
      invoicefor: 'Quotation',
      billNo: quotation.quoteNo,
      products: quotation.quotationProducts,
      customer: quotation.customer,
      date: quotation.date.split('T')[0],
      grandTotal: quotation.grandTotal,
      totalAmount: quotation.invoiceTotal,
    };

    navigate('/invoices/preview', { state: data });
  };

  // ---------------------------------------------------------
  // Delete Quotation
  // ---------------------------------------------------------
  // const handleDelete = (id) => {
  //   if (window.confirm('Are you sure you want to delete this quotation?')) {
  //     dispatch(deleteQuotation(id));
  //   }
  // };

  return (
    <div className='admin-container'>
      <AdminSidebar />

      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>Quotation List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Quote No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Print</th>
                  <th>Convert</th>
                  <th>Edit</th>
                  <th>Old Print</th>
                  {/* <th>Delete</th> */}
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td>Q-{quotation.quoteNo}</td>
                    <td>{quotation.customer?.name}</td>
                    <td>{formatDate(quotation.date.split('T')[0])}</td>
                    <td>₹{formatNumberWithCommas(quotation.grandTotal)}</td>

                    <td>
                      <button onClick={() => handlePrint(quotation)}>
                        Print
                      </button>
                    </td>

                    <td>
                      <button onClick={() => handleConvertToInvoice(quotation)}>
                        Convert
                      </button>
                    </td>

                    <td>
                      <button onClick={() => handleEditQuotation(quotation)}>
                        Edit
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleOldPrint(quotation)}>
                        Old Print
                      </button>
                    </td>

                    {/* <td>
                      <button
                        style={{ backgroundColor: 'red', color: 'white' }}
                        onClick={() => handleDelete(quotation._id)}
                      >
                        Delete
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuotationList;
