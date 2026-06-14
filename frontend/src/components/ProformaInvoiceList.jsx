import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { fetchProformaInvoices, deleteProformaInvoice } from '../slices/proformaSlice';
import { generateProformaInvoicePDF } from '../services/pdfGeneratorService';
import { formatDocumentNumber, formatNumberWithCommas } from '../services/helper';
import { ListToolbar, PaginationControls } from './ListControls';

const ProformaInvoiceList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    proformas,
    pagination,
    loading,
    error,
    availableFinancialYears,
    currentFinancialYear,
  } = useSelector((state) => state.proforma);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
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
    if (!selectedFinancialYear && currentFinancialYear) {
      setSelectedFinancialYear(currentFinancialYear);
      return;
    }

    dispatch(
      fetchProformaInvoices({
        page,
        limit,
        search,
        financialYear: selectedFinancialYear || undefined,
      })
    );
  }, [dispatch, page, limit, search, selectedFinancialYear, currentFinancialYear]);

  const handlePrint = (proforma) => {
    generateProformaInvoicePDF({
      customer: proforma.customer,
      billNo: formatDocumentNumber(
        proforma.proformaNo,
        proforma.financialYearLabel
      ),
      date: proforma.date.split('T')[0],
      products: proforma.proformaProducts,
      gst: proforma.gst,
      gstType: proforma.gstType || 'intraState',
      totalAmount: proforma.invoiceTotal,
      grandTotal: proforma.grandTotal,
      validUntil: proforma.validUntil?.split('T')[0] || '',
      termsAndConditions: proforma.termsAndConditions || '',
      shipTo: proforma.shipTo || null,
      challanNo: proforma.challanNo,
      challanDate: proforma.challanDate?.split('T')[0],
      orderNo: proforma.orderNo,
      orderDate: proforma.orderDate?.split('T')[0],
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
      userSignature: user.signature || null,
      companyLogo: user.companyLogo || null,
      template: user.pdfTemplate || 'classic',
    });
  };

  const handleConvertToInvoice = (proforma) => {
    navigate('/admin/invoice/new', {
      state: {
        fromProforma: true,
        proforma,
      },
    });
  };

  const handleEditProforma = (proforma) => {
    navigate(`/proformas/${proforma._id}/edit`, {
      state: { proformaInvoice: proforma },
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this proforma invoice?')) {
      dispatch(deleteProformaInvoice(id));
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>Proforma Invoice List</h2>
          <ListToolbar
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder='Search proforma invoices'
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
          <table>
            <thead>
              <tr>
                <th>Proforma No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Total</th>
                <th>Print</th>
                <th>Convert</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {proformas.map((proforma) => (
                <tr key={proforma._id}>
                  <td>
                    {formatDocumentNumber(
                      proforma.proformaNo,
                      proforma.financialYearLabel
                    )}
                  </td>
                  <td>{proforma.customer?.name}</td>
                  <td>{formatDate(proforma.date.split('T')[0])}</td>
                  <td>
                    {proforma.validUntil
                      ? formatDate(proforma.validUntil.split('T')[0])
                      : '-'}
                  </td>
                  <td>Rs {formatNumberWithCommas(proforma.grandTotal)}</td>
                  <td>
                    <button onClick={() => handlePrint(proforma)}>Print</button>
                  </td>
                  <td>
                    <button onClick={() => handleConvertToInvoice(proforma)}>
                      → Invoice
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleEditProforma(proforma)}>
                      Edit
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(proforma._id)}>
                      Delete
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

export default ProformaInvoiceList;
