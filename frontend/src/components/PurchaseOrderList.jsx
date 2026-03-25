import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { fetchPOs } from '../slices/poSlice';
import { formatNumberWithCommas } from '../services/helper';
import { ListToolbar, PaginationControls } from './ListControls';

const PurchaseOrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pos, pagination, loading, error } = useSelector((state) => state.po);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    dispatch(fetchPOs({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const handlePrint = (po) => {
    navigate('/po/preview', {
      state: {
        gst: po.gst,
        poNo: po.poNo,
        products: po.poProducts,
        seller: po.seller,
        date: po.date.split('T')[0],
        grandTotal: po.grandTotal,
        totalAmount: po.invoiceTotal,
      },
    });
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2>PO List</h2>
          <ListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search purchase orders'
          />
          {loading ? <p>Loading...</p> : null}
          {error ? <p>Error: {error}</p> : null}
          {!loading && !error ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>PO No</th>
                    <th>Seller</th>
                    <th>Date</th>
                    <th>Grand Total</th>
                    <th>Print</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((po) => (
                    <tr key={po._id}>
                      <td>{po.poNo}</td>
                      <td>{po.seller?.name}</td>
                      <td>{formatDate(po.date.split('T')[0])}</td>
                      <td>Rs {formatNumberWithCommas(po.grandTotal)}</td>
                      <td>
                        <button onClick={() => handlePrint(po)}>Print</button>
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
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default PurchaseOrderList;
