import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCustomer,
  setGst,
  setGstType,
  setInvoiceDiscount,
  addProduct,
  removeProduct,
  fetchBillNo,
  updateProduct,
  clearAllData,
} from '../slices/invoiceSlice.js';
import { fetchCustomers } from '../slices/customerSlice.js';
import '../styles/InvoiceForm.css';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axiosSetup.js';
import { generateInvoicePDF } from '../services/pdfGeneratorService.js';
import {
  formatDocumentNumber,
  getFinancialYearFromDate,
  getTodayDate,
} from '../services/helper.js';
import { uomList } from '../services/helper';

const InvoiceForm = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const addBtnRef = useRef(null);

  const isEdit = Boolean(location.state?.invoice);
  const invoiceToEdit = location.state?.invoice;
  const challanData = location.state?.fromChallan;
  const isFromQuotation = location.state?.fromQuotation;
  const quotationData = location.state?.quotation;
  const isFromProforma = location.state?.fromProforma;
  const proformaData = location.state?.proforma;

  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useSelector((state) => state.customers);

  const {
    billNo,
    financialYearLabel,
    customer,
    gst,
    gstType,
    products,
    totalAmount,
    invoiceDiscount,
    grandTotal,
  } = useSelector((state) => state.invoice);

  const [date, setDate] = useState(getTodayDate());
  const [challanNo, setChallanNo] = useState('');
  const [challanDate, setChallanDate] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [saving, setSaving] = useState(false);

  // product input
  const [name, setName] = useState('');
  const [hsn, setHsn] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [rate, setRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [uom, setUom] = useState('NOS');

  // Ship To
  const [sameAsBillTo, setSameAsBillTo] = useState(true);
  const [shipToName, setShipToName] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [shipToGst, setShipToGst] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  const parseDate = (d) => d?.split('T')[0];

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    dispatch(fetchCustomers());

    if (isFromQuotation && quotationData) {
      dispatch(setCustomer(quotationData.customer));
      dispatch(setGst(quotationData.gst));
      if (quotationData.gstType) dispatch(setGstType(quotationData.gstType));
      quotationData.quotationProducts.forEach((p) => dispatch(addProduct(p)));
      setDate(new Date().toISOString().split('T')[0]);
    }

    if (isFromProforma && proformaData) {
      dispatch(setCustomer(proformaData.customer));
      dispatch(setGst(proformaData.gst));
      if (proformaData.gstType) dispatch(setGstType(proformaData.gstType));
      proformaData.proformaProducts.forEach((p) => dispatch(addProduct(p)));
      setDate(new Date().toISOString().split('T')[0]);
      setOrderNo(proformaData.orderNo || '');
      setOrderDate(parseDate(proformaData.orderDate) || '');
      setTermsAndConditions(proformaData.termsAndConditions || '');
      if (proformaData.shipTo) {
        setSameAsBillTo(false);
        setShipToName(proformaData.shipTo.name || '');
        setShipToAddress(proformaData.shipTo.address || '');
        setShipToGst(proformaData.shipTo.gstNo || '');
      }
    }

    if (!isEdit && challanData) {
      dispatch(setCustomer(challanData.customer));
      setDate(new Date().toISOString().split('T')[0]);
      setChallanNo(challanData.challanNo || '');
      setChallanDate(parseDate(challanData.challanDate));
      setOrderNo(challanData.orderNo || '');
      setOrderDate(parseDate(challanData.orderDate));
      challanData.products.forEach((p) =>
        dispatch(addProduct({ name: p.name, hsn: p.hsn || '', quantity: p.quantity, rate: 0, discount: 0, uom: p.uom }))
      );
    }
  }, [dispatch, isEdit, isFromQuotation, quotationData, isFromProforma, proformaData, challanData]);

  useEffect(() => {
    if (!isEdit && date) dispatch(fetchBillNo(date));
  }, [dispatch, isEdit, date]);

  useEffect(() => {
    if (isEdit && invoiceToEdit) {
      dispatch(setCustomer(invoiceToEdit.customer));
      dispatch(setGst(invoiceToEdit.gst));
      dispatch(setGstType(invoiceToEdit.gstType || 'intraState'));
      invoiceToEdit.invoiceProducts.forEach((p) => dispatch(addProduct(p)));
      dispatch(setInvoiceDiscount(invoiceToEdit.invoiceDiscount || 0));
      setDate(parseDate(invoiceToEdit.date));
      setChallanNo(invoiceToEdit.challanNo || '');
      setChallanDate(parseDate(invoiceToEdit.challanDate));
      setOrderNo(invoiceToEdit.orderNo || '');
      setOrderDate(parseDate(invoiceToEdit.orderDate));
      setTermsAndConditions(invoiceToEdit.termsAndConditions || '');
      if (invoiceToEdit.shipTo) {
        setSameAsBillTo(false);
        setShipToName(invoiceToEdit.shipTo.name || '');
        setShipToAddress(invoiceToEdit.shipTo.address || '');
        setShipToGst(invoiceToEdit.shipTo.gstNo || '');
      }
    }
  }, [dispatch, isEdit, invoiceToEdit]);

  useEffect(() => { return () => dispatch(clearAllData()); }, [dispatch]);

  useEffect(() => {
    if (sameAsBillTo && customer) {
      setShipToName(customer.name || '');
      setShipToAddress(customer.address || '');
      setShipToGst(customer.gstNo || '');
    }
  }, [sameAsBillTo, customer]);

  // ---------------- HANDLERS ----------------
  const handleCustomerChange = (e) => {
    const selected = customers.find((c) => c._id === e.target.value);
    dispatch(setCustomer(selected));
  };

  const handleAddProduct = () => {
    if (!name || quantity <= 0 || rate < 0) {
      alert('Enter valid product details');
      return;
    }
    dispatch(addProduct({ name, hsn, quantity, rate, discount, uom }));
    setName(''); setHsn(''); setQuantity(0); setRate(0); setDiscount(0); setUom('NOS');
  };

  const handleRemoveProduct = (index) => dispatch(removeProduct(index));

  // PDF helper
  const getPdfExtras = () => ({
    companyName: user.companyDetails?.name,
    companyAddress: user.companyDetails?.address,
    companyGST: user.companyDetails?.gstin,
    companyPhone: user.companyDetails?.mobile,
    companyBank: user.bankDetails || {},
    userSignature: user.signature || null,
    companyLogo: user.companyLogo || null,
    template: user.pdfTemplate || 'classic',
  });

  const buildPdfPayload = (overrides = {}) => ({
    customer,
    products,
    gst,
    gstType,
    totalAmount,
    invoiceDiscount,
    grandTotal,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    termsAndConditions,
    ...getPdfExtras(),
    ...overrides,
  });

  // ---------------- SAVE ----------------
  const handleGenerateInvoice = async () => {
    if (!customer || products.length === 0 || !date) { alert('Incomplete invoice data'); return; }
    setSaving(true);
    try {
      const payload = {
        customer: customer._id, gst, gstType,
        invoiceProducts: products,
        invoiceTotal: totalAmount, invoiceDiscount, grandTotal, date,
        challanNo, challanDate, orderNo, orderDate, termsAndConditions,
        shipTo: sameAsBillTo ? null : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
      };
      const { data } = await api.post(`${apiUrl}/api/invoice/new`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedInvoice = data.invoice;
      generateInvoicePDF(buildPdfPayload({
        shipTo: payload.shipTo,
        billNo: formatDocumentNumber(savedInvoice.invoiceNo, savedInvoice.financialYearLabel),
      }));
      navigate('/invoices/all');
    } finally { setSaving(false); }
  };

  const handleSaveInvoice = async () => {
    if (!isEdit || !invoiceToEdit) { alert('Nothing to save'); return; }
    if (!customer || products.length === 0 || !date) { alert('Incomplete invoice data'); return; }
    setSaving(true);
    try {
      const payload = {
        customer: customer._id, gst, gstType,
        invoiceProducts: products,
        invoiceTotal: totalAmount, invoiceDiscount, grandTotal, date,
        challanNo, challanDate, orderNo, orderDate, termsAndConditions,
        shipTo: sameAsBillTo ? null : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
      };
      const { data } = await api.put(`${apiUrl}/api/invoice/${invoiceToEdit._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedInvoice = data.invoice;
      generateInvoicePDF(buildPdfPayload({
        shipTo: payload.shipTo,
        billNo: formatDocumentNumber(savedInvoice.invoiceNo, savedInvoice.financialYearLabel),
      }));
      navigate('/invoices/all');
    } catch (err) {
      console.error('Update invoice failed', err);
      alert('Failed to update invoice');
    } finally { setSaving(false); }
  };

  const handleGenerateDuplicate = () => {
    if (!customer || products.length === 0 || !date) { alert('Incomplete invoice data'); return; }
    generateInvoicePDF(buildPdfPayload({
      billNo, financialYearLabel,
      shipTo: sameAsBillTo ? null : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
    }));
  };

  // line amount helper for display
  const calcLineAmt = (p) => (Number(p.quantity) * Number(p.rate) * (1 - (Number(p.discount) || 0) / 100));
  const taxable = Math.max(totalAmount - (invoiceDiscount || 0), 0);
  const taxLabel = gstType === 'interState' ? `IGST (${gst * 2}%)` : `CGST+SGST (${gst}%+${gst}%)`;
  const taxAmt = taxable * (gst * 2) / 100;

  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>
        {isEdit ? 'Edit Invoice' : 'Create Invoice'}
      </h2>

      <form
        className='invoice-form'
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          // Allow Enter on Add Product button; block elsewhere (except textareas)
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
        {/* Customer */}
        <div className='form-group'>
          <label className='form-label'>Customer:</label>
          <select className='form-select' value={customer?._id || ''} onChange={handleCustomerChange}>
            <option value=''>Select</option>
            {customersLoading ? <option>Loading...</option>
              : customersError ? <option>Error</option>
              : customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Ship To */}
        <div className='form-group checkbox-group'>
          <label className='checkbox-label'>
            <input type='checkbox' checked={sameAsBillTo} onChange={(e) => setSameAsBillTo(e.target.checked)} />
            Ship To same as Bill To
          </label>
        </div>
        {!sameAsBillTo && (
          <>
            <h3 className='products-header'>Ship To (Optional)</h3>
            <div className='form-group'>
              <label className='form-label'>Ship To Name</label>
              <input type='text' className='form-input' value={shipToName} onChange={(e) => setShipToName(e.target.value)} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Ship To Address</label>
              <textarea className='form-input' value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} />
            </div>
            <div className='form-group'>
              <label className='form-label'>Ship To GST No</label>
              <input type='text' className='form-input' value={shipToGst} onChange={(e) => setShipToGst(e.target.value)} />
            </div>
          </>
        )}

        {/* Bill No */}
        <div className='form-group'>
          <label className='form-label'>Financial Year</label>
          <input type='text' className='form-input'
            value={isEdit ? invoiceToEdit.financialYearLabel || getFinancialYearFromDate(date) : financialYearLabel || getFinancialYearFromDate(date)}
            disabled />
        </div>
        <div className='form-group'>
          <label className='form-label'>Bill No</label>
          <input type='text' className='form-input'
            value={isEdit
              ? formatDocumentNumber(invoiceToEdit.invoiceNo, invoiceToEdit.financialYearLabel)
              : formatDocumentNumber(billNo, financialYearLabel || getFinancialYearFromDate(date))}
            disabled />
        </div>

        {/* Date */}
        <div className='form-group'>
          <label className='form-label'>Date:</label>
          <input type='date' className='form-input' value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '10rem' }} />
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
          <select className='form-select' value={gst} onChange={(e) => dispatch(setGst(Number(e.target.value)))}>
            <option value=''>Select</option>
            {gstType === 'interState' ? (
              <><option value={6}>12% (IGST)</option><option value={9}>18% (IGST)</option></>
            ) : (
              <><option value={6}>6% + 6% (CGST + SGST)</option><option value={9}>9% + 9% (CGST + SGST)</option></>
            )}
          </select>
        </div>

        {/* Challan / Order */}
        <div className='form-group'>
          <label className='form-label'>Challan No</label>
          <input type='text' className='form-input' value={challanNo} onChange={(e) => setChallanNo(e.target.value)} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Challan Date</label>
          <input type='date' className='form-input' value={challanDate} onChange={(e) => setChallanDate(e.target.value)} style={{ width: '10rem' }} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Order No:</label>
          <input type='text' className='form-input' value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Order Date:</label>
          <input type='date' className='form-input' value={orderDate} onChange={(e) => setOrderDate(e.target.value)} style={{ width: '10rem' }} />
        </div>

        {/* Products Table */}
        <h3 className='products-header'>Products</h3>
        {products.length > 0 ? (
          <table className='products-table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Rate</th>
                <th>Disc %</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>
                    <textarea
                      value={product.name}
                      onChange={(e) => dispatch(updateProduct({ index, updatedFields: { name: e.target.value } }))}
                      className='table-input table-textarea'
                      rows={3}
                    />
                  </td>
                  <td>
                    <input type='text' value={product.hsn || ''} onChange={(e) => dispatch(updateProduct({ index, updatedFields: { hsn: e.target.value } }))} className='table-input' />
                  </td>
                  <td>
                    <input type='number' value={product.quantity} onChange={(e) => dispatch(updateProduct({ index, updatedFields: { quantity: Number(e.target.value) } }))} className='table-input' />
                  </td>
                  <td>
                    <select value={product.uom} onChange={(e) => dispatch(updateProduct({ index, updatedFields: { uom: e.target.value } }))} className='table-select'>
                      {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type='number' value={product.rate} onChange={(e) => dispatch(updateProduct({ index, updatedFields: { rate: Number(e.target.value) } }))} className='table-input' />
                  </td>
                  <td>
                    <input type='number' value={product.discount ?? 0} min={0} max={100}
                      onChange={(e) => dispatch(updateProduct({ index, updatedFields: { discount: Number(e.target.value) } }))}
                      className='table-input' style={{ width: '3.5rem' }} />
                  </td>
                  <td>₹{calcLineAmt(product).toFixed(2)}</td>
                  <td>
                    <button type='button' className='remove-btn' onClick={() => handleRemoveProduct(index)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>No products added yet.</p>}

        {/* Add product fields */}
        <div className='form-group'>
          <label className='form-label'>Product Name</label>
          <textarea
            id='productName'
            className='form-input product-name-textarea'
            value={name}
            onChange={(e) => setName(e.target.value)}
            rows={4}
            placeholder='Product Details'
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>HSN Code</label>
          <input type='text' className='form-input' value={hsn} onChange={(e) => setHsn(e.target.value)} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Quantity:</label>
          <input type='number' className='form-input' value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Rate:</label>
          <input type='number' className='form-input' value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
        <div className='form-group'>
          <label className='form-label'>Discount (%)</label>
          <input type='number' className='form-input' value={discount} min={0} max={100} onChange={(e) => setDiscount(Number(e.target.value))} style={{ width: '6rem' }} />
        </div>
        <div className='form-group'>
          <label className='form-label'>UOM</label>
          <select className='form-select' value={uom} onChange={(e) => setUom(e.target.value)}>
            {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <button ref={addBtnRef} type='button' className='add-btn' onClick={handleAddProduct}>
          Add Product
        </button>

        {/* Totals */}
        <div className='invoice-totals'>
          <p>Subtotal: <span>₹{totalAmount?.toFixed(2)}</span></p>
          <div className='form-group' style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.4rem 0' }}>
            <label className='form-label' style={{ margin: 0 }}>Invoice Discount (₹)</label>
            <input type='number' className='form-input' value={invoiceDiscount || 0} min={0}
              onChange={(e) => dispatch(setInvoiceDiscount(Number(e.target.value)))}
              style={{ width: '8rem' }} />
          </div>
          <p>Taxable Amount: <span>₹{taxable.toFixed(2)}</span></p>
          <p>{taxLabel}: <span>₹{taxAmt.toFixed(2)}</span></p>
          <p>Grand Total: <span>₹{grandTotal?.toFixed?.(2) || grandTotal}</span></p>
        </div>

        <div className='form-section'>
          <div className='form-group'>
            <label htmlFor='termsAndConditions' className='form-label'>Terms &amp; Conditions</label>
            <textarea
              id='termsAndConditions'
              name='termsAndConditions'
              className='form-input'
              value={termsAndConditions || ''}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows='5'
              placeholder='Enter terms and conditions...'
            />
          </div>
        </div>

        {/* Actions */}
        <div className='form-actions'>
          {!isEdit ? (
            <button className='generate-btn' onClick={handleGenerateInvoice} disabled={saving}>
              {saving ? 'Saving...' : 'Generate Invoice & Save'}
            </button>
          ) : (
            <button className='save-btn' onClick={handleSaveInvoice} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Generate PDF'}
            </button>
          )}
          <button className='generate-vendor-btn' type='button' onClick={handleGenerateDuplicate}>
            Generate Duplicate (No Save)
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
