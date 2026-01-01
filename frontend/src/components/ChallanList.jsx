import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChallans } from '../slices/challanSlice';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { generateChallanPDF } from '../services/pdfGeneratorService';

const ChallanList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { challans, loading, error } = useSelector((state) => state.challan);
  const sortedChallans = [...challans].sort(
    (a, b) => Number(b.challanNo) - Number(a.challanNo)
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  // Fetch all challans
  useEffect(() => {
    dispatch(fetchChallans());
  }, [dispatch]);

  // ---------------------------------------------------------
  // Print challan → Generate PDF directly
  // ---------------------------------------------------------
  const handlePrint = (challan) => {
    const pdfData = {
      customer: challan.customer,
      challanNo: challan.challanNo,
      date: challan.challanDate?.split('T')[0],
      products: challan.challanProducts,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate?.split('T')[0],

      // company details
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
    };

    generateChallanPDF(pdfData);
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
      customer: challan.customer._id,
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
              <h2>Challan List</h2>

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
                  {sortedChallans.map((challan) => (
                    <tr key={challan._id}>
                      <td>{challan.challanNo}</td>
                      <td>{challan.customer?.name}</td>
                      <td>{formatDate(challan.challanDate?.split('T')[0])}</td>

                      <td>
                        <button onClick={() => handlePrint(challan)}>
                          Print
                        </button>
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
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default ChallanList;
