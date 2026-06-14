import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../axiosSetup.js';
import AdminSidebar from './AdminSidebar';
import { fetchPOs } from '../slices/poSlice';
import { generatePurchaseOrderPDF } from '../services/pdfGeneratorService';
import {
  formatDate,
  formatDocumentNumber,
  formatNumberWithCommas,
} from '../services/helper';
import { ListToolbar, PaginationControls } from './ListControls';

const PurchaseOrderList = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    pos,
    pagination,
    loading,
    error,
    availableFinancialYears,
    currentFinancialYear,
  } = useSelector((state) => state.po);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
      fetchPOs({
        page,
        limit,
        search,
        financialYear: selectedFinancialYear || undefined,
      })
    );
  }, [dispatch, page, limit, search, selectedFinancialYear, currentFinancialYear]);

  const handlePrint = (po) => {
    generatePurchaseOrderPDF({
      seller: po.seller,
      poNo: formatDocumentNumber(po.poNo, po.financialYearLabel),
      date: po.date?.split('T')[0],
      products: po.poProducts,
      gst: po.gst,
      gstType: po.gstType || 'intraState',
      totalAmount: po.invoiceTotal,
      grandTotal: po.grandTotal,
      technicalSpecifications: po.technicalSpecifications || '',
      termsAndConditions: po.termsAndConditions || '',
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

  const handleEdit = (po) => {
    navigate(`/po/${po._id}/edit`, { state: { po } });
  };

  const handleDelete = async (poId) => {
    if (!window.confirm('Delete this purchase order?')) {
      return;
    }

    try {
      await api.delete(`${apiUrl}/api/po/${poId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(
        fetchPOs({
          page,
          limit,
          search,
          financialYear: selectedFinancialYear || undefined,
        })
      );
    } catch (requestError) {
      alert(
        requestError.response?.data?.message ||
          'Unable to delete purchase order'
      );
    }
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <ListToolbar
            title='Purchase Orders'
            subtitle='Search PO number, seller, or date.'
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder='Search purchase orders'
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
          {loading ? <p>Loading...</p> : null}
          {error ? <p>Error: {error}</p> : null}
          <table>
            <thead>
              <tr>
                <th>PO No</th>
                <th>Seller</th>
                <th>Date</th>
                <th>Grand Total</th>
                <th>Print</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po._id}>
                  <td>{formatDocumentNumber(po.poNo, po.financialYearLabel)}</td>
                  <td>{po.seller?.name}</td>
                  <td>{formatDate(po.date?.split('T')[0])}</td>
                  <td>₹{formatNumberWithCommas(po.grandTotal)}</td>
                  <td>
                    <button onClick={() => handlePrint(po)}>Print</button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(po)}>Edit</button>
                  </td>
                  <td>
                    <button
                      type='button'
                      className='remove-btn'
                      onClick={() => handleDelete(po._id)}
                    >
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

export default PurchaseOrderList;
