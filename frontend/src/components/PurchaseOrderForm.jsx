import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/InvoiceForm.css';
import {
  setSeller,
  setGst,
  addProduct,
  removeProduct,
  clearPoData,
  fetchLastPO,
  sendPOData,
  updateProduct,
} from '../slices/poSlice';
import { fetchSellers } from '../slices/customerSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const PurchaseOrderForm = () => {
  const parseDate = (d) => d?.split('T')[0];

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = location.state?.po ? true : false;
  const poToEdit = location.state?.po;

  const { sellers, loading, error } = useSelector((state) => state.customers);
  const { seller, products, gst, totalAmount, grandTotal, poNo } = useSelector(
    (state) => state.po
  );

  const [product, setProduct] = useState({
    name: '',
    quantity: 1,
    rate: 0,
    uom: 'NOS',
  });
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    dispatch(fetchSellers());
    if (!isEdit) dispatch(fetchLastPO());

    if (isEdit) {
      dispatch(setSeller(poToEdit.customer._id));
      dispatch(setGst(poToEdit.gst));
      setQuotationDate(parseDate(poToEdit.date));
      poToEdit.quotationProducts.forEach((p) => dispatch(addProduct(p)));
    }
  }, [dispatch, isEdit]);

  const handleAddProduct = () => {
    if (!product.name || product.quantity <= 0 || product.rate < 0) return;
    dispatch(addProduct(product));
    setProduct({ name: '', quantity: 1, rate: 0, uom: 'NOS' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product && !quotationDate && !seller) e.preventDefault();
    const selectedSeller = sellers.find((c) => c._id === seller);
    const poData = {
      seller: selectedSeller, // for printing
      poNo: poNo,
      date: quotationDate,
      products,
      gst,
      totalAmount,
      grandTotal,
      invoicefor: 'PO',
    };
    await dispatch(
      sendPOData({
        seller,
        poNo: poNo,
        poProducts: products,
        gst,
        invoiceTotal: totalAmount,
        grandTotal,
        date: parseDate(quotationDate),
      })
    ).then(() => {
      dispatch(clearPoData());
      navigate('/po/preview', { state: poData });
    });
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <div className='create-invoice-container'>
        <div className='invoice-container'>
          <h2 className='invoice-header'>{isEdit ? 'Edit PO' : 'Create PO'}</h2>
          <form className='invoice-form' onSubmit={handleSubmit}>
            <div className='form-group'>
              <label htmlFor='quoteNo' className='form-label'>
                Quote No:
              </label>
              <input
                type='text'
                id='quoteNo'
                className='form-input'
                value={`Q-${poNo || 0}`}
                disabled
              />
            </div>
            <div className='form-group'>
              <label htmlFor='quotationDate' className='form-label'>
                Quotation Date:
              </label>
              <input
                type='date'
                id='quotationDate'
                className='form-input'
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                required
              />
            </div>

            <div className='form-group'>
              <label htmlFor='customer' className='form-label'>
                Seller:
              </label>
              <select
                id='customer'
                className='form-select'
                value={seller || ''}
                onChange={(e) => dispatch(setSeller(e.target.value))}
                required
              >
                <option value=''>Select Customer</option>
                {loading ? (
                  <option value=''>Loading...</option>
                ) : error ? (
                  <option value=''>Error</option>
                ) : (
                  sellers.map((cust) => (
                    <option key={cust._id} value={cust._id}>
                      {cust.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='gst' className='form-label'>
                GST (%)
              </label>
              <select
                id='gst'
                className='form-select'
                value={gst}
                onChange={(e) => dispatch(setGst(Number(e.target.value)))}
                required
              >
                <option value=''>Select</option>
                <option value={6}>6%</option>
                <option value={9}>9%</option>
              </select>
            </div>

            <h3 className='products-header'>Products</h3>
            {products.length > 0 ? (
              <table className='products-table'>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>UOM</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          type='text'
                          value={p.name}
                          onChange={(e) =>
                            dispatch(
                              updateProduct({
                                index: i,
                                updatedFields: { name: e.target.value },
                              })
                            )
                          }
                          className='table-input'
                        />
                      </td>
                      <td>
                        <input
                          type='number'
                          value={p.quantity}
                          onChange={(e) =>
                            dispatch(
                              updateProduct({
                                index: i,
                                updatedFields: {
                                  quantity: Number(e.target.value),
                                },
                              })
                            )
                          }
                          className='table-input'
                        />
                      </td>
                      <td>
                        <select
                          value={p.uom}
                          onChange={(e) =>
                            dispatch(
                              updateProduct({
                                index: i,
                                updatedFields: { uom: e.target.value },
                              })
                            )
                          }
                          className='table-select'
                        >
                          <option value='NOS'>NOS</option>
                          <option value='Kg'>Kg</option>
                          <option value='Liters'>Liters</option>
                          <option value='Set'>Set</option>
                          <option value='Meter'>Meter</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type='number'
                          value={p.rate}
                          onChange={(e) =>
                            dispatch(
                              updateProduct({
                                index: i,
                                updatedFields: { rate: Number(e.target.value) },
                              })
                            )
                          }
                          className='table-input'
                        />
                      </td>
                      <td>{p.quantity * p.rate}</td>
                      <td>
                        <button
                          type='button'
                          className='remove-btn'
                          onClick={() => dispatch(removeProduct(i))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className='no-products'>No products added yet.</p>
            )}

            <div className='form-group'>
              <label htmlFor='productName' className='form-label'>
                Product Name
              </label>
              <input
                type='text'
                id='productName'
                className='form-input'
                value={product.name}
                onChange={(e) =>
                  setProduct({ ...product, name: e.target.value })
                }
              />
            </div>

            <div className='form-group'>
              <label htmlFor='uom' className='form-label'>
                UOM
              </label>
              <select
                id='uom'
                className='form-select'
                value={product.uom}
                onChange={(e) =>
                  setProduct({ ...product, uom: e.target.value })
                }
              >
                <option value='NOS'>NOS</option>
                <option value='Kg'>Kg</option>
                <option value='Liters'>Liters</option>
                <option value='Set'>Set</option>
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='quantity' className='form-label'>
                Quantity
              </label>
              <input
                type='number'
                id='quantity'
                className='form-input'
                value={product.quantity}
                onChange={(e) =>
                  setProduct({ ...product, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div className='form-group'>
              <label htmlFor='rate' className='form-label'>
                Rate
              </label>
              <input
                type='number'
                id='rate'
                className='form-input'
                value={product.rate}
                onChange={(e) =>
                  setProduct({ ...product, rate: Number(e.target.value) })
                }
              />
            </div>

            <button
              type='button'
              className='add-btn'
              onClick={handleAddProduct}
            >
              Add Product
            </button>

            <div className='invoice-totals'>
              <p>Total Amount: ₹{totalAmount}</p>

              <p>Grand Total: ₹{grandTotal}</p>
            </div>

            <div className='form-actions'>
              <button type='submit' className='generate-btn'>
                {isEdit ? 'Save Changes' : 'Save PO'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
