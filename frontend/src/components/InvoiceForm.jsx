import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCustomer,
  setGst,
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

const InvoiceForm = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = Boolean(location.state?.invoice);
  const invoiceToEdit = location.state?.invoice;
  const challanData = location.state?.fromChallan;
  const isFromQuotation = location.state?.fromQuotation;
  const quotationData = location.state?.quotation;

  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useSelector((state) => state.customers);

  const { billNo, customer, gst, products, totalAmount, grandTotal } =
    useSelector((state) => state.invoice);

  const [date, setDate] = useState('');
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
    if (!isEdit) dispatch(fetchBillNo());

    if (isFromQuotation && quotationData) {
      dispatch(setCustomer(quotationData.customer));
      dispatch(setGst(quotationData.gst));
      quotationData.quotationProducts.forEach((p) => dispatch(addProduct(p)));
      setDate(new Date().toISOString().split('T')[0]);
    }

    if (!isEdit && challanData) {
      dispatch(setCustomer(challanData.customer));
      setDate(new Date().toISOString().split('T')[0]);
      setChallanNo(challanData.challanNo || '');
      setChallanDate(parseDate(challanData.challanDate));
      setOrderNo(challanData.orderNo || '');
      setOrderDate(parseDate(challanData.orderDate));

      challanData.products.forEach((p) =>
        dispatch(
          addProduct({
            name: p.name,
            hsn: p.hsn || '',
            quantity: p.quantity,
            rate: 0,
            uom: p.uom,
          })
        )
      );
    }
  }, [dispatch, isEdit, isFromQuotation, quotationData, challanData]);

  // ---------------- EDIT MODE ----------------
  useEffect(() => {
    if (isEdit && invoiceToEdit) {
      dispatch(setCustomer(invoiceToEdit.customer));
      dispatch(setGst(invoiceToEdit.gst));
      invoiceToEdit.invoiceProducts.forEach((p) => dispatch(addProduct(p)));

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

  // ---------------- CLEANUP ----------------
  useEffect(() => {
    return () => dispatch(clearAllData());
  }, [dispatch]);

  // ---------------- SHIP TO SYNC ----------------
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
    dispatch(addProduct({ name, hsn, quantity, rate, uom }));
    setName('');
    setHsn('');
    setQuantity(0);
    setRate(0);
    setUom('NOS');
  };

  const handleRemoveProduct = (index) => {
    dispatch(removeProduct(index));
  };

  // ---------------- SAVE ----------------
  const handleGenerateInvoice = async () => {
    if (!customer || products.length === 0 || !date) {
      alert('Incomplete invoice data');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer: customer._id,
        invoiceNo: billNo,
        gst,
        invoiceProducts: products,
        invoiceTotal: totalAmount,
        grandTotal,
        date,
        challanNo,
        challanDate,
        orderNo,
        orderDate,
        termsAndConditions,
        shipTo: sameAsBillTo
          ? null
          : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
      };

      await api.post(`${apiUrl}/api/invoice/new`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      generateInvoicePDF({
        customer,
        shipTo: payload.shipTo,
        billNo,
        products,
        gst,
        totalAmount,
        grandTotal,
        date,
        challanNo,
        challanDate,
        orderNo,
        orderDate,
        termsAndConditions,
        companyName: user.companyDetails?.name,
        companyAddress: user.companyDetails?.address,
        companyGST: user.companyDetails?.gstin,
        companyPhone: user.companyDetails?.mobile,
        companyBank: user.bankDetails || {},
      });

      navigate('/invoices/all');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!isEdit || !invoiceToEdit) {
      alert('Nothing to save');
      return;
    }
    if (!customer || products.length === 0 || !date) {
      alert('Incomplete invoice data');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer: customer._id,
        gst,
        invoiceProducts: products,
        invoiceTotal: totalAmount,
        grandTotal,
        date,
        challanNo,
        challanDate,
        orderNo,
        orderDate,
        termsAndConditions,
        shipTo: sameAsBillTo
          ? null
          : {
              name: shipToName,
              address: shipToAddress,
              gstNo: shipToGst,
            },
      };

      await api.put(`${apiUrl}/api/invoice/${invoiceToEdit._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      generateInvoicePDF({
        customer,
        shipTo: payload.shipTo,
        billNo: invoiceToEdit.invoiceNo,
        products,
        gst,
        totalAmount,
        grandTotal,
        date,
        challanNo,
        challanDate,
        orderNo,
        orderDate,
        termsAndConditions,
        companyName: user.companyDetails?.name,
        companyAddress: user.companyDetails?.address,
        companyGST: user.companyDetails?.gstin,
        companyPhone: user.companyDetails?.mobile,
        companyBank: user.bankDetails || {},
      });

      navigate('/invoices/all');
    } catch (err) {
      console.error('Update invoice failed', err);
      alert('Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDuplicate = () => {
    if (!customer || products.length === 0 || !date) {
      alert('Incomplete invoice data');
      return;
    }

    generateInvoicePDF({
      customer,
      shipTo: sameAsBillTo
        ? null
        : {
            name: shipToName,
            address: shipToAddress,
            gstNo: shipToGst,
          },
      billNo,
      products,
      gst,
      totalAmount,
      grandTotal,
      date,
      challanNo,
      challanDate,
      orderNo,
      orderDate,
      termsAndConditions,
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
    });
  };

  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>
        {isEdit ? 'Edit Invoice' : 'Create Invoice'}
      </h2>

      <form className='invoice-form' onSubmit={(e) => e.preventDefault()}>
        {/* Customer */}
        <div className='form-group'>
          <label className='form-label'>Customer:</label>
          <select
            className='form-select'
            value={customer?._id || ''}
            onChange={handleCustomerChange}
          >
            <option value=''>Select</option>
            {customersLoading ? (
              <option>Loading...</option>
            ) : customersError ? (
              <option>Error</option>
            ) : (
              customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        {/* Ship To Same as Bill To */}
        <div className='form-group checkbox-group'>
          <label className='checkbox-label'>
            <input
              type='checkbox'
              checked={sameAsBillTo}
              onChange={(e) => setSameAsBillTo(e.target.checked)}
            />
            Ship To same as Bill To
          </label>
        </div>
        {!sameAsBillTo && (
          <>
            <h3 className='products-header'>Ship To (Optional)</h3>

            <div className='form-group'>
              <label className='form-label'>Ship To Name</label>
              <input
                type='text'
                className='form-input'
                value={shipToName}
                onChange={(e) => setShipToName(e.target.value)}
              />
            </div>

            <div className='form-group'>
              <label className='form-label'>Ship To Address</label>
              <textarea
                className='form-input'
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
              />
            </div>

            <div className='form-group'>
              <label className='form-label'>Ship To GST No</label>
              <input
                type='text'
                className='form-input'
                value={shipToGst}
                onChange={(e) => setShipToGst(e.target.value)}
              />
            </div>
          </>
        )}
        {/* Bill No */}
        <div className='form-group'>
          <label className='form-label'>Bill No</label>
          <input
            type='text'
            className='form-input'
            value={isEdit ? invoiceToEdit.invoiceNo : billNo}
            disabled
          />
        </div>
        {/* Date */}
        <div className='form-group'>
          <label className='form-label'>Date:</label>
          <input
            type='date'
            className='form-input'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '10rem' }}
          />
        </div>
        {/* GST */}
        <div className='form-group'>
          <label className='form-label'>GST</label>
          <select
            className='form-select'
            value={gst}
            onChange={(e) => dispatch(setGst(Number(e.target.value)))}
          >
            <option value=''>Select</option>
            <option value={6}>6%</option>
            <option value={9}>9%</option>
          </select>
        </div>
        {/* Challan No */}
        <div className='form-group'>
          <label className='form-label'>Challan No</label>
          <input
            type='text'
            className='form-input'
            value={challanNo}
            onChange={(e) => setChallanNo(e.target.value)}
          />
        </div>
        {/* Challan Date */}
        <div className='form-group'>
          <label className='form-label'>Challan Date</label>
          <input
            type='date'
            className='form-input'
            value={challanDate}
            onChange={(e) => setChallanDate(e.target.value)}
            style={{ width: '10rem' }}
          />
        </div>
        {/* Order No */}
        <div className='form-group'>
          <label className='form-label'>Order No:</label>
          <input
            type='text'
            className='form-input'
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
          />
        </div>
        {/* Order Date */}
        <div className='form-group'>
          <label className='form-label'>Order Date:</label>
          <input
            type='date'
            className='form-input'
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            style={{ width: '10rem' }}
          />
        </div>
        {/* Products */}
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
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type='text'
                      value={product.name}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index,
                            updatedFields: { name: e.target.value },
                          })
                        )
                      }
                      className='table-input'
                    />
                  </td>

                  <td>
                    <input
                      type='text'
                      value={product.hsn || ''}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index,
                            updatedFields: { hsn: e.target.value },
                          })
                        )
                      }
                      className='table-input'
                    />
                  </td>

                  <td>
                    <input
                      type='number'
                      value={product.quantity}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index,
                            updatedFields: { quantity: Number(e.target.value) },
                          })
                        )
                      }
                      className='table-input'
                    />
                  </td>

                  <td>
                    <select
                      value={product.uom}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index,
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
                    </select>
                  </td>

                  <td>
                    <input
                      type='number'
                      value={product.rate}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index,
                            updatedFields: { rate: Number(e.target.value) },
                          })
                        )
                      }
                      className='table-input'
                    />
                  </td>

                  <td>₹{(product.quantity * product.rate).toFixed(2)}</td>

                  <td>
                    <button
                      type='button'
                      className='remove-btn'
                      onClick={() => handleRemoveProduct(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products added yet.</p>
        )}
        {/* Add product fields */}
        <div className='form-group'>
          <label className='form-label'>Product Name:</label>
          <input
            type='text'
            id='productName'
            className='form-input'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>HSN Code</label>
          <input
            type='text'
            className='form-input'
            value={hsn}
            onChange={(e) => setHsn(e.target.value)}
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>Quantity:</label>
          <input
            type='number'
            className='form-input'
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>Rate:</label>
          <input
            type='number'
            className='form-input'
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>
        <div className='form-group'>
          <label className='form-label'>UOM</label>
          <select
            className='form-select'
            value={uom}
            onChange={(e) => setUom(e.target.value)}
          >
            <option value='NOS'>NOS</option>
            <option value='Kg'>Kg</option>
            <option value='Liters'>Liters</option>
            <option value='Set'>Set</option>
          </select>
        </div>
        <button type='button' className='add-btn' onClick={handleAddProduct}>
          Add Product
        </button>
        {/* Totals */}
        <div className='invoice-totals'>
          <p>
            Total Amount:{' '}
            <span>₹{totalAmount?.toFixed?.(2) || totalAmount}</span>
          </p>
          <p>
            Grand Total: <span>₹{grandTotal?.toFixed?.(2) || grandTotal}</span>
          </p>
        </div>
        <div className='form-section'>
          <div className='form-group'>
            <label htmlFor='termsAndConditions' className='form-label'>
              Terms & Conditions
            </label>
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
            <button
              className='generate-btn'
              onClick={handleGenerateInvoice}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Generate Invoice & Save'}
            </button>
          ) : (
            <>
              <button
                className='save-btn'
                onClick={handleSaveInvoice}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Generate PDF'}
              </button>
            </>
          )}

          <button
            className='generate-vendor-btn'
            type='button'
            onClick={handleGenerateDuplicate}
          >
            Generate Duplicate (No Save)
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
