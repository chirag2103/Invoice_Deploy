import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChallans } from '../slices/challanSlice';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';

const ChallanList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { challans, loading, error } = useSelector((state) => state.challan);

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    dispatch(fetchChallans());
  }, [dispatch]);

  const handlePrint = (challan) => {
    const data = {
      challanNo: challan.challanNo,
      invoicefor: 'Challan',
      billNo: challan.challanNo,
      products: challan.challanProducts,
      customer: challan.customer,
      date: challan.challanDate.split('T')[0],
      orderNo: challan.orderNo,
      orderDate: challan.orderDate?.split('T')[0],
    };

    navigate('/invoices/preview', { state: data });
  };

  const handleConvertToInvoice = (challan) => {
    const data = {
      fromChallan: true,
      challanNo: challan.challanNo,
      challanDate: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      customer: challan.customer._id,
      products: challan.challanProducts.map((product) => ({
        name: product.name,
        quantity: product.quantity,
        uom: product.uom,
        rate: 0, // let user add rate in invoice form
      })),
    };
    // console.log(data.products);

    navigate('/admin/invoice/new', { state: { fromChallan: data } });
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
                      <td>Challan No</td>
                      <td>Company</td>
                      <td>Date</td>
                      <td>Print</td>
                      <td>Convert to Invoice</td>
                    </tr>
                  </thead>
                  <tbody>
                    {challans.map((challan) => (
                      <tr key={challan._id}>
                        <td>{challan.challanNo}</td>
                        <td>{challan.customer?.name}</td>
                        <td>{formatDate(challan.challanDate.split('T')[0])}</td>
                        <td>
                          <button onClick={() => handlePrint(challan)}>
                            Print
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleConvertToInvoice(challan)}
                          >
                            Convert
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

export default ChallanList;
