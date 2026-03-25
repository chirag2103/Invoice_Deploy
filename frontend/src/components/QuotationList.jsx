import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { fetchQuotations } from '../slices/quotationSlice';
import { generateQuotationPDF } from '../services/pdfGeneratorService';
import { formatNumberWithCommas } from '../services/helper';
import { ListToolbar, PaginationControls } from './ListControls';

const QuotationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { quotations, pagination, loading, error } = useSelector(
    (state) => state.quotation
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchQuotations({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const handlePrint = (quotation) => {
    generateQuotationPDF({
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
    });
  };

  const handleConvertToInvoice = (quotation) => {
    navigate('/admin/invoice/new', {
      state: { fromQuotation: true, quotation },
    });
  };

  const handleEditQuotation = (quotation) => {
    navigate(`/quotations/${quotation._id}/edit`, { state: { quotation } });
  };

  const handleOldPrint = (quotation) => {
    navigate('/invoices/preview', {
      state: {
        gst: quotation.gst,
        invoicefor: 'Quotation',
        billNo: quotation.quoteNo,
        products: quotation.quotationProducts,
        customer: quotation.customer,
        date: quotation.date.split('T')[0],
        grandTotal: quotation.grandTotal,
        totalAmount: quotation.invoiceTotal,
      },
    });
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>Quotation List</h2>
          <ListToolbar
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder='Search quotations'
          />
          {error ? <p>Error: {error}</p> : null}
          {loading ? <p>Loading...</p> : null}
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
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation._id}>
                  <td>Q-{quotation.quoteNo}</td>
                  <td>{quotation.customer?.name}</td>
                  <td>{formatDate(quotation.date.split('T')[0])}</td>
                  <td>Rs {formatNumberWithCommas(quotation.grandTotal)}</td>
                  <td>
                    <button onClick={() => handlePrint(quotation)}>Print</button>
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
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default QuotationList;
