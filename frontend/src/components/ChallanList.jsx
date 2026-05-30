import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChallans } from '../slices/challanSlice';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { generateChallanPDF } from '../services/pdfGeneratorService';
import { ListToolbar, PaginationControls } from './ListControls';
import { formatDocumentNumber } from '../services/helper';

const ChallanList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    challans,
    pagination,
    loading,
    error,
    availableFinancialYears,
    currentFinancialYear,
  } = useSelector((state) => state.challan);
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
      fetchChallans({
        page,
        limit,
        search,
        financialYear: selectedFinancialYear || undefined,
      }),
    );
  }, [
    dispatch,
    page,
    limit,
    search,
    selectedFinancialYear,
    currentFinancialYear,
  ]);

  // ---------------------------------------------------------
  // Print challan → Generate PDF directly
  // ---------------------------------------------------------
  const handlePrint = (challan) => {
    const shipTo = challan.shipTo ? challan.shipTo : challan.customer;
    console.log(shipTo);
    const pdfData = {
      customer: challan.customer,
      challanNo: formatDocumentNumber(
        challan.challanNo,
        challan.financialYearLabel,
      ),
      date: challan.challanDate?.split('T')[0],
      products: challan.challanProducts,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate?.split('T')[0],

      // company details
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      userSignature: user.signature || null,
    };

    generateChallanPDF(pdfData, shipTo);
  };

  // ---------------------------------------------------------
  // Convert challan → Invoice
  // ---------------------------------------------------------
  const handleConvertToInvoice = (challan) => {
    const convertData = {
      fromChallan: true,
      challanNo: challan.challanNo,
      challanDate: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      customerId: challan.customer._id,
      customer: challan.customer,

      products: challan.challanProducts.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        uom: p.uom,
        rate: 0, // user will input rate in invoice form
      })),
    };

    navigate('/admin/invoice/new', { state: { fromChallan: convertData } });
  };

  // ---------------------------------------------------------
  // Delete challan (optional)
  // ---------------------------------------------------------
  // const handleDelete = (id) => {
  //   if (window.confirm("Are you sure you want to delete this challan?")) {
  //     dispatch(deleteChallan(id));
  //   }
  // };

  return (
    <div className='admin-container'>
      <AdminSidebar />

      <main className='invoice-list'>
        <div className='invoice-container'>
          <ListToolbar
            title='Challan List'
            subtitle='Search challan number, customer, or date.'
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder='Search challans'
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
                <th>Challan No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Print</th>
                <th>Convert</th>
                {/* <th>Delete</th> */}
              </tr>
            </thead>

            <tbody>
              {challans.map((challan) => (
                <tr key={challan._id}>
                  <td>
                    {formatDocumentNumber(
                      challan.challanNo,
                      challan.financialYearLabel,
                    )}
                  </td>
                  <td>{challan.customer?.name}</td>
                  <td>{formatDate(challan.challanDate?.split('T')[0])}</td>

                  <td>
                    <button onClick={() => handlePrint(challan)}>Print</button>
                  </td>

                  <td>
                    <button onClick={() => handleConvertToInvoice(challan)}>
                      Convert
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

export default ChallanList;
