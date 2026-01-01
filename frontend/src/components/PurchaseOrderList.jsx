import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { fetchQuotations } from '../slices/quotationSlice';
import { fetchPOs } from '../slices/poSlice';
import { formatNumberWithCommas } from '../services/helper';

const PurchaseOrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  const { pos, loading, error } = useSelector((state) => state.po);

  useEffect(() => {
    dispatch(fetchPOs());
  }, [dispatch]);

  const handlePrint = (po) => {
    const data = {
      gst: po.gst,
      poNo: po.poNo,
      products: po.poProducts,
      seller: po.seller,
      date: po.date.split('T')[0],
      grandTotal: po.grandTotal,
      totalAmount: po.invoiceTotal,
    };

    navigate('/po/preview', { state: data });
  };
  // const handleEditQuotation = (quotation) => {
  //   const data = {
  //     fromQuotation: true,
  //     quotation: quotation,
  //   };
  //   navigate('/admin/quotation/edit', { state: data });
  // };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>PO List</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>PO No</th>
                  <th>Seller</th>
                  <th>Date</th>
                  <th>Grand Total</th>
                  <th>Print</th>
                  {/* <th>Convert</th>
                  <th>Edit</th> */}
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po._id}>
                    <td>{po.poNo}</td>
                    <td>{po.seller?.name}</td>
                    <td>{formatDate(po.date.split('T')[0])}</td>
                    <td>₹{formatNumberWithCommas(po.grandTotal)}</td>
                    <td>
                      <button onClick={() => handlePrint(po)}>Print</button>
                    </td>
                    {/* <td>
                      <button onClick={() => handleConvertToInvoice(quotation)}>
                        Convert
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleEditQuotation(quotation)}>
                        Edit
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

export default PurchaseOrderList;
