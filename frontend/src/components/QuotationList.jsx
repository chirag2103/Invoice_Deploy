import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { fetchQuotations } from '../slices/quotationSlice';

const QuotationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { quotations, loading, error } = useSelector(
    (state) => state.quotation
  );

  useEffect(() => {
    dispatch(fetchQuotations());
  }, [dispatch]);

  const handlePrint = (quotation) => {
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
  const handleConvertToInvoice = (quotation) => {
    const data = {
      fromQuotation: true,
      quotation: quotation,
    };
    navigate('/admin/invoice/new', { state: data });
  };

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
                  <th>Grand Total</th>
                  <th>Print</th>
                  <th>Convert</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td>{quotation.quoteNo}</td>
                    <td>{quotation.customer.name}</td>
                    <td>{quotation.date.split('T')[0]}</td>
                    <td>₹{quotation.grandTotal}</td>
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
