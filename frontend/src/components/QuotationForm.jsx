import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/InvoiceForm.css';

import {
  setCustomer,
  setGst,
  setGstType,
  setInvoiceDiscount,
  addProduct,
  removeProduct,
  updateProduct,
  clearQuotationData,
  fetchQuoteNo,
  sendQuotationData,
} from '../slices/quotationSlice';

import { fetchCustomers } from '../slices/customerSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axiosSetup';
import { uomList } from '../services/helper';

import { generateQuotationPDF } from '../services/pdfGeneratorService';
import {
  formatDocumentNumber,
  getFinancialYearFromDate,
  getTodayDate,
} from '../services/helper';

const QuotationForm = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const addBtnRef = useRef(null);

  const isEdit = Boolean(location.state?.quotation);
  const quotationToEdit = location.state?.quotation;

  const { customers, loading, error } = useSelector((state) => state.customers);
  const {
    customer,
    products,
    gst,
    gstType,
    totalAmount,
    invoiceDiscount,
    grandTotal,
    quoteNo,
    financialYearLabel,
  } = useSelector((state) => state.quotation);

  const [quotationDate, setQuotationDate] = useState(getTodayDate());
  const [product, setProduct] = useState({ name: '', quantity: 1, rate: 0, discount: 0, uom: 'NOS' });
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');

  // ---------------------------------------------------------
  // Load Customers + Prefill for Edit
  // ---------------------------------------------------------
  useEffect(() => {
    dispatch(fetchCustomers());
    if (!isEdit) dispatch(fetchQuoteNo(quotationDate));

    if (isEdit && quotationToEdit) {
      dispatch(setCustomer(quotationToEdit.customer._id));
      dispatch(setGst(quotationToEdit.gst));
      dispatch(setGstType(quotationToEdit.gstType || 'intraState'));
      quotationToEdit.quotationProducts.forEach((p) => dispatch(addProduct(p)));
      dispatch(setInvoiceDiscount(quotationToEdit.invoiceDiscount || 0));
      setQuotationDate(quotationToEdit.date?.split('T')[0]);
      setTermsAndConditions(quotationToEdit.termsAndConditions || '');
      setTechnicalSpecifications(quotationToEdit.technicalSpecifications || '');
    }
    // eslint-disable-next-line
  }, [dispatch, isEdit]);

  useEffect(() => {
    if (!isEdit && quotationDate) dispatch(fetchQuoteNo(quotationDate));
  }, [dispatch, isEdit, quotationDate]);

  // ---------------------------------------------------------
  // Add Product
  // ---------------------------------------------------------
  const handleAddProduct = () => {
    if (!product.name || product.quantity <= 0 || product.rate < 0) {
      alert('Enter valid product details.');
      return;
    }
    dispatch(addProduct(product));
    setProduct({ name: '', quantity: 1, rate: 0, discount: 0, uom: 'NOS' });
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer || products.length === 0) {
      alert('Select customer and add at least one product.');
      return;
    }

    const selectedCustomer = customers.find((c) => c._id === customer);

    const pdfData = {
      customer: selectedCustomer,
      quotationNo: isEdit
        ? formatDocumentNumber(quotationToEdit.quoteNo, quotationToEdit.financialYearLabel)
        : formatDocumentNumber(quoteNo, financialYearLabel || getFinancialYearFromDate(quotationDate)),
      date: quotationDate,
      products,
      totalAmount,
      invoiceDiscount,
      grandTotal,
      gst,
      gstType,
      termsAndConditions,
      technicalSpecifications,
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
      userSignature: user.signature || null,
      companyLogo: user.companyLogo || null,
      template: user.pdfTemplate || 'classic',
    };

    try {
      if (isEdit) {
        await api.put(
          `${apiUrl}/api/quotation/${quotationToEdit._id}`,
          {
            customer, gst, gstType,
            quotationProducts: products,
            date: quotationDate,
            grandTotal,
            invoiceTotal: totalAmount,
            invoiceDiscount,
            technicalSpecifications,
            termsAndConditions,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        const result = await dispatch(
          sendQuotationData({
            customer,
            quotationProducts: products,
            gst, gstType,
            invoiceTotal: totalAmount,
            invoiceDiscount,
            grandTotal,
            date: quotationDate,
            technicalSpecifications,
            termsAndConditions,
          })
        );

        if (result.meta.requestStatus === 'fulfilled' && result.payload?.quotation) {
          pdfData.quotationNo = formatDocumentNumber(
            result.payload.quotation.quoteNo,
            result.payload.quotation.financialYearLabel
          );
        }
      }

      generateQuotationPDF(pdfData);
      dispatch(clearQuotationData());
      navigate('/quotations/all');
    } catch (err) {
      console.error('Quotation save error:', err);
      alert('Failed to save quotation.');
    }
  };

  const calcLineAmt = (p) => Number(p.quantity) * Number(p.rate) * (1 - (Number(p.discount) || 0) / 100);
  const taxable = Math.max(totalAmount - (invoiceDiscount || 0), 0);
  const taxLabel = gstType === 'interState' ? `IGST (${gst * 2}%)` : `CGST+SGST (${gst}%+${gst}%)`;
  const taxAmt = taxable * (gst * 2) / 100;

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>
        {isEdit ? 'Edit Quotation' : 'Create Quotation'}
      </h2>

      <form
        className='invoice-form'
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            if (e.target === addBtnRef.current) {
              e.preventDefault();
              handleAddProduct();
            } else {
              e.preventDefault();
            }
          }
        }}
      >
        {/* Quote No */}
        <div className='form-group'>
          <label className='form-label'>Financial Year</label>
          <input type='text' className='form-input'
            value={isEdit ? quotationToEdit.financialYearLabel || getFinancialYearFromDate(quotationDate) : financialYearLabel || getFinancialYearFromDate(quotationDate)}
            disabled />
        </div>
        <div className='form-group'>
          <label className='form-label'>Quote No:</label>
          <input type='text' className='form-input'
            value={isEdit
              ? formatDocumentNumber(quotationToEdit.quoteNo, quotationToEdit.financialYearLabel)
              : formatDocumentNumber(quoteNo || 0, financialYearLabel || getFinancialYearFromDate(quotationDate))}
            disabled />
        </div>

        {/* Date */}
        <div className='form-group'>
          <label className='form-label'>Quotation Date</label>
          <input type='date' className='form-input' value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} required />
        </div>

        {/* Customer */}
        <div className='form-group'>
          <label className='form-label'>Customer</label>
          <select className='form-select' value={customer || ''} onChange={(e) => dispatch(setCustomer(e.target.value))} required>
            <option value=''>Select Customer</option>
            {loading ? <option>Loading...</option>
              : error ? <option>Error loading customers</option>
              : customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* GST */}
        <div className='form-group'>
          <label className='form-label'>GST Type</label>
          <select className='form-select' value={gstType} onChange={(e) => dispatch(setGstType(e.target.value))}>
            <option value='intraState'>CGST + SGST (Intra-State)</option>
            <option value='interState'>IGST (Inter-State)</option>
          </select>
        </div>
        <div className='form-group'>
          <label className='form-label'>GST Rate</label>
          <select className='form-select' value={gst} onChange={(e) => dispatch(setGst(Number(e.target.value)))} required>
            <option value=''>Select</option>
            {gstType === 'interState'
              ? <><option value={6}>12% (IGST)</option><option value={9}>18% (IGST)</option></>
              : <><option value={6}>6% + 6% (CGST + SGST)</option><option value={9}>9% + 9% (CGST + SGST)</option></>}
          </select>
        </div>

        {/* Products Table */}
        <h3 className='products-header'>Products</h3>
        {products.length === 0 ? (
          <p className='no-products'>No products added</p>
        ) : (
          <table className='products-table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Rate</th>
                <th>Disc %</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>
                    <textarea value={p.name}
                      onChange={(e) => dispatch(updateProduct({ index: i, updatedFields: { name: e.target.value } }))}
                      className='table-input table-textarea' rows={3} />
                  </td>
                  <td>
                    <input type='number' value={p.quantity}
                      onChange={(e) => dispatch(updateProduct({ index: i, updatedFields: { quantity: Number(e.target.value) } }))}
                      className='table-input' />
                  </td>
                  <td>
                    <select value={p.uom}
                      onChange={(e) => dispatch(updateProduct({ index: i, updatedFields: { uom: e.target.value } }))}
                      className='table-select'>
                      {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type='number' value={p.rate}
                      onChange={(e) => dispatch(updateProduct({ index: i, updatedFields: { rate: Number(e.target.value) } }))}
                      className='table-input' />
                  </td>
                  <td>
                    <input type='number' value={p.discount ?? 0} min={0} max={100}
                      onChange={(e) => dispatch(updateProduct({ index: i, updatedFields: { discount: Number(e.target.value) } }))}
                      className='table-input' style={{ width: '3.5rem' }} />
                  </td>
                  <td>₹{calcLineAmt(p).toFixed(2)}</td>
                  <td>
                    <button type='button' className='remove-btn' onClick={() => dispatch(removeProduct(i))}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add Product Section */}
        <div className='form-group'>
          <label className='form-label'>Product Name</label>
          <textarea
            className='form-input product-name-textarea'
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            rows={4}
            placeholder='Product Details'
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>UOM</label>
          <select className='form-select' value={product.uom} onChange={(e) => setProduct({ ...product, uom: e.target.value })}>
            {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className='form-group'>
          <label className='form-label'>Quantity</label>
          <input type='number' className='form-input' value={product.quantity} onChange={(e) => setProduct({ ...product, quantity: Number(e.target.value) })} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Rate</label>
          <input type='number' className='form-input' value={product.rate} onChange={(e) => setProduct({ ...product, rate: Number(e.target.value) })} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Discount (%)</label>
          <input type='number' className='form-input' value={product.discount} min={0} max={100}
            onChange={(e) => setProduct({ ...product, discount: Number(e.target.value) })} style={{ width: '6rem' }} />
        </div>
        <button ref={addBtnRef} type='button' className='add-btn' onClick={handleAddProduct}>
          Add Product
        </button>

        {/* Terms & Specs */}
        <div className='form-section'>
          <h3>Terms &amp; Conditions</h3>
          <div className='form-group'>
            <label htmlFor='termsAndConditions' className='form-label'>Terms &amp; Conditions</label>
            <textarea id='termsAndConditions' className='form-input' value={termsAndConditions || ''}
              onChange={(e) => setTermsAndConditions(e.target.value)} rows='5' placeholder='Enter terms and conditions...' />
          </div>
        </div>
        <div className='form-section'>
          <h3>Technical Details</h3>
          <div className='form-group'>
            <label htmlFor='technicalSpecifications' className='form-label'>Technical Specifications</label>
            <textarea id='technicalSpecifications' className='form-input' value={technicalSpecifications || ''}
              onChange={(e) => setTechnicalSpecifications(e.target.value)} rows='5' placeholder='Enter technical specifications...' />
          </div>
        </div>

        {/* Totals */}
        <div className='invoice-totals'>
          <p>Subtotal: <span>₹{totalAmount?.toFixed(2)}</span></p>
          <div className='form-group' style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.4rem 0' }}>
            <label className='form-label' style={{ margin: 0 }}>Invoice Discount (₹)</label>
            <input type='number' className='form-input' value={invoiceDiscount || 0} min={0}
              onChange={(e) => dispatch(setInvoiceDiscount(Number(e.target.value)))} style={{ width: '8rem' }} />
          </div>
          <p>Taxable Amount: <span>₹{taxable.toFixed(2)}</span></p>
          <p>{taxLabel}: <span>₹{taxAmt.toFixed(2)}</span></p>
          <p>Grand Total: <span>₹{grandTotal}</span></p>
        </div>

        {/* Submit */}
        <div className='form-actions'>
          <button type='submit' className='generate-btn'>
            {isEdit ? 'Save Changes & Generate PDF' : 'Save & Generate PDF'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
