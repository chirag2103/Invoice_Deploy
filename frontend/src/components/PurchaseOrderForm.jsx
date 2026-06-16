import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../axiosSetup.js';
import AdminSidebar from './AdminSidebar';
import '../styles/InvoiceForm.css';
import { fetchSellers } from '../slices/customerSlice';
import {
  addProduct,
  clearPoData,
  fetchPONo,
  removeProduct,
  sendPOData,
  setGst,
  setGstType,
  setInvoiceDiscount,
  setSeller,
  updateProduct,
} from '../slices/poSlice';
import { generatePurchaseOrderPDF } from '../services/pdfGeneratorService';
import {
  formatDocumentNumber,
  getFinancialYearFromDate,
  getTodayDate,
  uomList,
} from '../services/helper';

const PurchaseOrderForm = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(location.state?.po);
  const poToEdit = location.state?.po;
  const addBtnRef = useRef(null);
  const nameTextareaRef = useRef(null);

  const { sellers, loading, error } = useSelector((state) => state.customers);
  const {
    seller,
    products,
    gst,
    gstType,
    totalAmount,
    invoiceDiscount,
    grandTotal,
    poNo,
    financialYearLabel,
  } = useSelector((state) => state.po);

  const [poDate, setPoDate] = useState(getTodayDate());
  const [product, setProduct] = useState({ name: '', hsn: '', quantity: 1, rate: 0, discount: 0, uom: 'NOS' });
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSellers());
    return () => dispatch(clearPoData());
  }, [dispatch]);

  useEffect(() => {
    if (!isEdit || !poToEdit) return;
    dispatch(setSeller(poToEdit.seller?._id || poToEdit.seller));
    dispatch(setGst(poToEdit.gst));
    dispatch(setGstType(poToEdit.gstType || 'intraState'));
    dispatch(setInvoiceDiscount(poToEdit.invoiceDiscount || 0));
    setPoDate(poToEdit.date?.split('T')[0] || getTodayDate());
    setTermsAndConditions(poToEdit.termsAndConditions || '');
    setTechnicalSpecifications(poToEdit.technicalSpecifications || '');
    poToEdit.poProducts.forEach((item) => dispatch(addProduct(item)));
  }, [dispatch, isEdit, poToEdit]);

  useEffect(() => {
    if (!isEdit && poDate) dispatch(fetchPONo(poDate));
  }, [dispatch, isEdit, poDate]);

  const handleAddProduct = () => {
    if (!product.name.trim() || product.quantity <= 0 || product.rate < 0) {
      alert('Enter valid product details.');
      return;
    }
    dispatch(addProduct(product));
    setProduct({ name: '', hsn: '', quantity: 1, rate: 0, discount: 0, uom: 'NOS' });
    nameTextareaRef.current?.focus();
  };

  const selectedSeller = sellers.find((item) => item._id === seller);
  const calcLineAmt = (p) => Number(p.quantity) * Number(p.rate) * (1 - (Number(p.discount) || 0) / 100);
  const taxable = Math.max(totalAmount - (invoiceDiscount || 0), 0);
  const taxLabel = gstType === 'interState' ? `IGST (${gst * 2}%)` : `CGST+SGST (${gst}%+${gst}%)`;
  const taxAmt = taxable * (gst * 2) / 100;

  const pdfData = (savedValues = {}) => ({
    seller: selectedSeller,
    poNo: formatDocumentNumber(
      savedValues.poNo ?? poNo,
      savedValues.financialYearLabel || (isEdit ? poToEdit?.financialYearLabel : financialYearLabel || getFinancialYearFromDate(poDate))
    ),
    date: poDate,
    products,
    gst,
    gstType,
    totalAmount,
    invoiceDiscount,
    grandTotal,
    technicalSpecifications,
    termsAndConditions,
    companyName: user.companyDetails?.name,
    companyAddress: user.companyDetails?.address,
    companyGST: user.companyDetails?.gstin,
    companyPhone: user.companyDetails?.mobile,
    companyBank: user.bankDetails || {},
    userSignature: user.signature || null,
    companyLogo: user.companyLogo || null,
    template: user.pdfTemplate || 'classic',
  });

  const savePayload = {
    seller, poProducts: products, gst, gstType,
    invoiceTotal: totalAmount, invoiceDiscount, grandTotal,
    date: poDate, termsAndConditions, technicalSpecifications,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!seller || products.length === 0) { alert('Select seller and add at least one product.'); return; }

    setSaving(true);
    try {
      if (isEdit && poToEdit) {
        const { data } = await api.put(`${apiUrl}/api/po/${poToEdit._id}`, savePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        generatePurchaseOrderPDF(pdfData({ poNo: data.po.poNo, financialYearLabel: data.po.financialYearLabel }));
      } else {
        const result = await dispatch(sendPOData(savePayload));
        if (result.meta.requestStatus !== 'fulfilled' || !result.payload?.po) {
          throw new Error(result.payload || 'Unable to save purchase order');
        }
        generatePurchaseOrderPDF(pdfData({ poNo: result.payload.po.poNo, financialYearLabel: result.payload.po.financialYearLabel }));
      }
      navigate('/pos/all');
    } catch (requestError) {
      console.error('Purchase order save error', requestError);
      alert(requestError.response?.data?.message || requestError.message || 'Failed to save purchase order.');
    } finally { setSaving(false); }
  };

  const handleGenerateWithoutSaving = () => {
    if (!selectedSeller || products.length === 0) { alert('Select seller and add at least one product.'); return; }
    generatePurchaseOrderPDF(pdfData());
  };

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='invoice-list'>
        <div className='invoice-container'>
          <h2 className='invoice-header'>{isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>

          <form
            className='invoice-form'
            onSubmit={handleSubmit}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                if (event.target === addBtnRef.current) {
                  event.preventDefault();
                  handleAddProduct();
                } else {
                  event.preventDefault();
                }
              }
            }}
          >
            <div className='form-group'>
              <label className='form-label'>Financial Year</label>
              <input type='text' className='form-input'
                value={isEdit ? poToEdit?.financialYearLabel || getFinancialYearFromDate(poDate) : financialYearLabel || getFinancialYearFromDate(poDate)}
                disabled />
            </div>
            <div className='form-group'>
              <label className='form-label'>PO No.</label>
              <input type='text' className='form-input'
                value={isEdit ? formatDocumentNumber(poToEdit?.poNo, poToEdit?.financialYearLabel) : formatDocumentNumber(poNo, financialYearLabel || getFinancialYearFromDate(poDate))}
                disabled />
            </div>
            <div className='form-group'>
              <label className='form-label'>PO Date</label>
              <input type='date' className='form-input' value={poDate} onChange={(e) => setPoDate(e.target.value)} required />
            </div>
            <div className='form-group'>
              <label className='form-label'>Seller</label>
              <select className='form-select' value={seller || ''} onChange={(e) => dispatch(setSeller(e.target.value))} required>
                <option value=''>Select Seller</option>
                {loading ? <option>Loading...</option>
                  : error ? <option>Error loading sellers</option>
                  : sellers.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div className='form-group'>
              <label className='form-label'>GST Type</label>
              <select className='form-select' value={gstType} onChange={(e) => dispatch(setGstType(e.target.value))}>
                <option value='intraState'>CGST + SGST (Intra-State)</option>
                <option value='interState'>IGST (Inter-State)</option>
              </select>
            </div>
            <div className='form-group'>
              <label className='form-label'>GST Rate</label>
              <select className='form-select' value={gst} onChange={(e) => dispatch(setGst(Number(e.target.value)))}>
                <option value=''>Select</option>
                {gstType === 'interState'
                  ? <><option value={6}>12% (IGST)</option><option value={9}>18% (IGST)</option></>
                  : <><option value={6}>6% + 6% (CGST + SGST)</option><option value={9}>9% + 9% (CGST + SGST)</option></>}
              </select>
            </div>

            <h3 className='products-header'>Products</h3>
            {products.length === 0 ? (
              <p className='no-products'>No products added</p>
            ) : (
              <table className='products-table'>
                <thead>
                  <tr>
                    <th>Name</th><th>HSN</th><th>Qty</th><th>UOM</th><th>Rate</th><th>Disc %</th><th>Amount</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <textarea value={item.name}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { name: e.target.value } }))}
                          className='table-input table-textarea' rows={3} />
                      </td>
                      <td>
                        <input type='text' value={item.hsn || ''}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { hsn: e.target.value } }))}
                          className='table-input' />
                      </td>
                      <td>
                        <input type='number' value={item.quantity}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { quantity: Number(e.target.value) } }))}
                          className='table-input' />
                      </td>
                      <td>
                        <select value={item.uom}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { uom: e.target.value } }))}
                          className='table-select'>
                          {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type='number' value={item.rate}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { rate: Number(e.target.value) } }))}
                          className='table-input' />
                      </td>
                      <td>
                        <input type='number' value={item.discount ?? 0} min={0} max={100}
                          onChange={(e) => dispatch(updateProduct({ index, updatedFields: { discount: Number(e.target.value) } }))}
                          className='table-input' style={{ width: '3.5rem' }} />
                      </td>
                      <td>{`₹${calcLineAmt(item).toFixed(2)}`}</td>
                      <td>
                        <button type='button' className='remove-btn' onClick={() => dispatch(removeProduct(index))}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add Product inputs */}
            <div className='form-group'>
              <label className='form-label'>Product Name</label>
              <textarea ref={nameTextareaRef} className='form-input product-name-textarea'
                value={product.name}
                onChange={(e) => setProduct((c) => ({ ...c, name: e.target.value }))}
                rows={4} placeholder='Product Details' />
            </div>
            <div className='form-group'>
              <label className='form-label'>HSN Code</label>
              <input type='text' className='form-input' value={product.hsn}
                onChange={(e) => setProduct((c) => ({ ...c, hsn: e.target.value }))} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Quantity</label>
              <input type='number' className='form-input' value={product.quantity}
                onChange={(e) => setProduct((c) => ({ ...c, quantity: Number(e.target.value) }))} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Rate</label>
              <input type='number' className='form-input' value={product.rate}
                onChange={(e) => setProduct((c) => ({ ...c, rate: Number(e.target.value) }))} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Discount (%)</label>
              <input type='number' className='form-input' value={product.discount} min={0} max={100}
                onChange={(e) => setProduct((c) => ({ ...c, discount: Number(e.target.value) }))} style={{ width: '6rem' }} />
            </div>
            <div className='form-group'>
              <label className='form-label'>UOM</label>
              <select className='form-select' value={product.uom} onChange={(e) => setProduct((c) => ({ ...c, uom: e.target.value }))}>
                {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button ref={addBtnRef} type='button' className='add-btn' onClick={handleAddProduct}>
              Add Product
            </button>

            <div className='form-section'>
              <h3>Terms &amp; Conditions</h3>
              <div className='form-group'>
                <textarea className='form-input' value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)} rows='5' placeholder='Enter terms and conditions...' />
              </div>
            </div>
            <div className='form-section'>
              <h3>Technical Details</h3>
              <div className='form-group'>
                <textarea className='form-input' value={technicalSpecifications}
                  onChange={(e) => setTechnicalSpecifications(e.target.value)} rows='5' placeholder='Enter technical specifications...' />
              </div>
            </div>

            {/* Totals */}
            <div className='invoice-totals'>
              <p>Subtotal: <span>₹{totalAmount.toFixed(2)}</span></p>
              <div className='form-group' style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.4rem 0' }}>
                <label className='form-label' style={{ margin: 0 }}>Invoice Discount (₹)</label>
                <input type='number' className='form-input' value={invoiceDiscount || 0} min={0}
                  onChange={(e) => dispatch(setInvoiceDiscount(Number(e.target.value)))} style={{ width: '8rem' }} />
              </div>
              <p>Taxable Amount: <span>₹{taxable.toFixed(2)}</span></p>
              <p>{taxLabel}: <span>₹{taxAmt.toFixed(2)}</span></p>
              <p>Grand Total: <span>₹{grandTotal.toFixed(2)}</span></p>
            </div>

            <div className='form-actions'>
              <button type='submit' className='generate-btn' disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes & Generate PDF' : 'Save & Generate PDF'}
              </button>
              <button type='button' className='generate-vendor-btn' onClick={handleGenerateWithoutSaving}>
                Generate Preview PDF
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PurchaseOrderForm;
