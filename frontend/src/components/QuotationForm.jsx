import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/InvoiceForm.css';

import {
  setCustomer,
  setGst,
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

import { generateQuotationPDF } from '../services/pdfGeneratorService';
import { getTodayDate } from '../services/helper';

const QuotationForm = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = Boolean(location.state?.quotation);
  const quotationToEdit = location.state?.quotation;

  const { customers, loading, error } = useSelector((state) => state.customers);
  const { customer, products, gst, totalAmount, grandTotal, quoteNo } =
    useSelector((state) => state.quotation);

  const [quotationDate, setQuotationDate] = useState(getTodayDate());

  const [product, setProduct] = useState({
    name: '',
    quantity: 1,
    rate: 0,
    uom: 'NOS',
  });

  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');

  const nameTextareaRef = useRef(null);

  const handleProductNameKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = product.name;
      const newValue =
        currentVal.substring(0, start) + '    ' + currentVal.substring(end);
      setProduct({ ...product, name: newValue });
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 4;
        textarea.selectionEnd = start + 4;
      });
    }
  };

  // ---------------------------------------------------------
  // Load Customers + Prefill for Edit
  // ---------------------------------------------------------
  useEffect(() => {
    dispatch(fetchCustomers());
    if (!isEdit) dispatch(fetchQuoteNo());

    if (isEdit && quotationToEdit) {
      dispatch(setCustomer(quotationToEdit.customer._id));
      dispatch(setGst(quotationToEdit.gst));
      quotationToEdit.quotationProducts.forEach((p) => dispatch(addProduct(p)));
      setQuotationDate(quotationToEdit.date?.split('T')[0]);
      setTermsAndConditions(quotationToEdit.termsAndConditions || '');
      setTechnicalSpecifications(quotationToEdit.technicalSpecifications || '');
    }
    // eslint-disable-next-line
  }, [dispatch, isEdit]);

  // ---------------------------------------------------------
  // Add Product
  // ---------------------------------------------------------
  const handleAddProduct = () => {
    if (!product.name || product.quantity <= 0 || product.rate < 0) {
      alert('Enter valid product details.');
      return;
    }
    dispatch(addProduct(product));
    setProduct({ name: '', quantity: 1, rate: 0, uom: 'NOS' });
  };

  // ---------------------------------------------------------
  // Add / Remove / Update Specs & Terms
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // Submit (Save + Generate PDF)
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
      quotationNo: isEdit ? quotationToEdit.quoteNo : quoteNo,
      date: quotationDate,
      products,
      totalAmount,
      grandTotal,
      gst,
      termsAndConditions,
      technicalSpecifications,
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
    };

    try {
      if (isEdit) {
        await api.put(
          `${apiUrl}/api/quotation/${quotationToEdit._id}`,
          {
            customer,
            quoteNo: quotationToEdit.quoteNo,
            gst,
            quotationProducts: products,
            date: quotationDate,
            grandTotal,
            invoiceTotal: totalAmount,
            technicalSpecifications,
            termsAndConditions,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await dispatch(
          sendQuotationData({
            customer,
            quoteNo: quoteNo,
            quotationProducts: products,
            gst,
            invoiceTotal: totalAmount,
            grandTotal,
            date: quotationDate,
            technicalSpecifications,
            termsAndConditions,
          }),
        );
      }

      // Generate PDF directly
      generateQuotationPDF(pdfData);

      dispatch(clearQuotationData());

      // Redirect
      navigate('/quotations/all');
    } catch (error) {
      console.error('Quotation save error:', error);
      alert('Failed to save quotation.');
    }
  };

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
            e.preventDefault();
          }
        }}
      >
        {/* Quote No */}
        <div className='form-group'>
          <label className='form-label'>Quote No:</label>
          <input
            type='text'
            className='form-input'
            value={
              isEdit ? `Q-${quotationToEdit.quoteNo}` : `Q-${quoteNo || 0}`
            }
            disabled
          />
        </div>

        {/* Date */}
        <div className='form-group'>
          <label className='form-label'>Quotation Date</label>
          <input
            type='date'
            className='form-input'
            value={quotationDate}
            onChange={(e) => setQuotationDate(e.target.value)}
            required
          />
        </div>

        {/* Customer */}
        <div className='form-group'>
          <label className='form-label'>Customer</label>
          <select
            className='form-select'
            value={customer || ''}
            onChange={(e) => dispatch(setCustomer(e.target.value))}
            required
          >
            <option value=''>Select Customer</option>
            {loading ? (
              <option>Loading...</option>
            ) : error ? (
              <option>Error loading customers</option>
            ) : (
              customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* GST */}
        <div className='form-group'>
          <label className='form-label'>GST (%)</label>
          <select
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

        {/* Products */}
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
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>
                    <textarea
                      value={p.name}
                      onChange={(e) =>
                        dispatch(
                          updateProduct({
                            index: i,
                            updatedFields: { name: e.target.value },
                          }),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const start = e.target.selectionStart;
                          const end = e.target.selectionEnd;
                          const newValue =
                            p.name.substring(0, start) +
                            '    ' +
                            p.name.substring(end);
                          dispatch(
                            updateProduct({
                              index: i,
                              updatedFields: { name: newValue },
                            }),
                          );
                          requestAnimationFrame(() => {
                            e.target.selectionStart = start + 4;
                            e.target.selectionEnd = start + 4;
                          });
                        }
                      }}
                      className='table-input table-textarea'
                      rows={3}
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
                          }),
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
                          }),
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
                          }),
                        )
                      }
                      className='table-input'
                    />
                  </td>

                  <td>₹{(p.quantity * p.rate).toFixed(2)}</td>

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
        )}

        {/* Add Product Section */}
        <div className='form-group'>
          <label className='form-label'>Product Name</label>
          <textarea
            ref={nameTextareaRef}
            className='form-input product-name-textarea'
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            onKeyDown={handleProductNameKeyDown}
            rows={4}
            placeholder={
              'Line 1: Product name\n    Tab to indent sub-details\n    e.g. Capacity - 5 Ton'
            }
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>UOM</label>
          <select
            className='form-select'
            value={product.uom}
            onChange={(e) => setProduct({ ...product, uom: e.target.value })}
          >
            <option value='NOS'>NOS</option>
            <option value='Kg'>Kg</option>
            <option value='Liters'>Liters</option>
            <option value='Set'>Set</option>
          </select>
        </div>

        <div className='form-group'>
          <label className='form-label'>Quantity</label>
          <input
            type='number'
            className='form-input'
            value={product.quantity}
            onChange={(e) =>
              setProduct({ ...product, quantity: Number(e.target.value) })
            }
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Rate</label>
          <input
            type='number'
            className='form-input'
            value={product.rate}
            onChange={(e) =>
              setProduct({ ...product, rate: Number(e.target.value) })
            }
          />
        </div>

        <button type='button' className='add-btn' onClick={handleAddProduct}>
          Add Product
        </button>

        <div className='form-section'>
          <h3>Terms & Conditions</h3>

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
        <div className='form-section'>
          <h3>Technical Details</h3>

          <div className='form-group'>
            <label htmlFor='technicalSpecifications' className='form-label'>
              Technical Specifications
            </label>
            <textarea
              id='technicalSpecifications'
              name='technicalSpecifications'
              className='form-input'
              value={technicalSpecifications || ''}
              onChange={(e) => setTechnicalSpecifications(e.target.value)}
              rows='5'
              placeholder='Enter technical specifications...'
            />
          </div>
        </div>

        {/* Totals */}
        <div className='invoice-totals'>
          <p>Total Amount: ₹{totalAmount}</p>
          <p>Grand Total: ₹{grandTotal}</p>
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
