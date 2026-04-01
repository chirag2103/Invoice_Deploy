import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { fetchInvoices } from '../slices/invoiceSlice';
import { ListToolbar, PaginationControls } from './ListControls';
import { generateInvoicePDF } from '../services/pdfGeneratorService.js';
import {
  formatDocumentNumber,
  formatNumberWithCommas,
} from '../services/helper.js';

const InvoiceList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    invoices,
    pagination,
    loading,
    error,
    availableFinancialYears,
    currentFinancialYear,
  } = useSelector(
    (state) => state.invoice
  );
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
    if (!selectedFinancialYear && currentFinancialYear) {
      setSelectedFinancialYear(currentFinancialYear);
      return;
    }

    dispatch(
      fetchInvoices({
        page,
        limit,
        search,
        financialYear: selectedFinancialYear || undefined,
      })
    );
  }, [dispatch, page, limit, search, selectedFinancialYear, currentFinancialYear]);

  const handlePrint = (invoice, invoicefor) => {
    generateInvoicePDF({
      challanNo: invoice.challanNo || '',
      gst: invoice.gst,
      invoicefor,
      billNo: formatDocumentNumber(
        invoice.invoiceNo,
        invoice.financialYearLabel
      ),
      products: invoice.invoiceProducts,
      customer: invoice.customer,
      date: invoice.date.split('T'),
      challanDate: invoice.challanDate?.split('T'),
      grandTotal: invoice.grandTotal,
      totalAmount: invoice.invoiceTotal,
      orderNo: invoice?.orderNo,
      orderDate: invoice?.orderDate?.split('T'),
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
    });
  };

  const handleOldPrint = (invoice, invoicefor) => {
    navigate('/invoices/preview', {
      state: {
        challanNo: invoice.challanNo || '',
        gst: invoice.gst,
        invoicefor,
        billNo: formatDocumentNumber(
          invoice.invoiceNo,
          invoice.financialYearLabel
        ),
        products: invoice.invoiceProducts,
        customer: invoice.customer,
        date: invoice.date.split('T')[0],
        challanDate: invoice.challanDate?.split('T')[0],
        grandTotal: invoice.grandTotal,
        totalAmount: invoice.invoiceTotal,
        orderNo: invoice?.orderNo,
        orderDate: invoice?.orderDate?.split('T')[0],
      },
    });
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <ListToolbar
            title='Invoices'
            subtitle='Search invoice number, customer, amount, or place of supply.'
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder='Search invoices'
            actions={
              <select
                value={selectedFinancialYear}
                onChange={(event) => {
                  setSelectedFinancialYear(event.target.value);
                  setPage(1);
                }}
              >
                <option value=''>All FY</option>
                {availableFinancialYears.map((financialYear) => (
                  <option key={financialYear} value={financialYear}>
                    FY {financialYear}
                  </option>
                ))}
              </select>
            }
          />
          {error ? <p>Error: {error}</p> : null}
          {loading ? <p>Loading...</p> : null}
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
                      <td>
                        {formatDocumentNumber(
                          invoice.invoiceNo,
                          invoice.financialYearLabel
                        )}
                      </td>
                    <td>{invoice?.customer?.name}</td>
                    <td>{formatDate(invoice.date.split('T')[0])}</td>
                    <td>{formatNumberWithCommas(invoice.grandTotal)}</td>
                    <td>
                      <button onClick={() => handlePrint(invoice, 'Original Copy')}>
                        Original
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handlePrint(invoice, 'Duplicate Copy')}>
                        Duplicate
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleOldPrint(invoice, 'Original Copy')}>
                        Old Original
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleOldPrint(invoice, 'Duplicate Copy')}>
                        Old Duplicate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default InvoiceList;
