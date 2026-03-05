import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/InvoiceForm.css';

import {
  setChallanCustomer,
  setChallanDate,
  setChallanNo,
  setOrderNo,
  setOrderDate,
  addChallanProduct,
  removeChallanProduct,
  updateProductField as updateChallanProduct,
  fetchChallanNo,
  sendChallanData,
} from '../slices/challanSlice';

import { fetchCustomers } from '../slices/customerSlice';
import { useNavigate } from 'react-router-dom';
import { generateChallanPDF } from '../services/pdfGeneratorService';
import { uomList } from '../services/helper';

const ChallanForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customers = useSelector((state) => state.customers.customers);
  const challan = useSelector((state) => state.challan);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // -----------------------------
  // Ship To State
  // -----------------------------
  const [sameAsBillTo, setSameAsBillTo] = useState(true);
  const [shipToName, setShipToName] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [shipToGst, setShipToGst] = useState('');

  // -----------------------------
  // New Product State
  // -----------------------------
  const [newProduct, setNewProduct] = useState({
    name: '',
    hsn: '',
    quantity: '',
    uom: 'NOS',
  });

  // ref for the add-product textarea
  const nameTextareaRef = useRef(null);

  // -----------------------------
  // Tab handler for add-product textarea
  // -----------------------------
  const handleNewProductNameKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        newProduct.name.substring(0, start) +
        '    ' +
        newProduct.name.substring(end);
      setNewProduct({ ...newProduct, name: newValue });
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 4;
        textarea.selectionEnd = start + 4;
      });
    }
  };

  // -----------------------------
  // Initial Load
  // -----------------------------
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchChallanNo());
  }, [dispatch]);

  // -----------------------------
  // Auto-fill Ship To
  // -----------------------------
  useEffect(() => {
    if (sameAsBillTo && challan.customer) {
      const cust = customers.find((c) => c._id === challan.customer);
      if (cust) {
        setShipToName(cust.name || '');
        setShipToAddress(cust.address || '');
        setShipToGst(cust.gstNo || '');
      }
    }
  }, [sameAsBillTo, challan.customer, customers]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.quantity) {
      alert('Enter product name and quantity.');
      return;
    }
    dispatch(addChallanProduct(newProduct));
    setNewProduct({ name: '', hsn: '', quantity: '', uom: 'NOS' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'challanDate':
        dispatch(setChallanDate(value));
        break;
      case 'orderNo':
        dispatch(setOrderNo(value));
        break;
      case 'orderDate':
        dispatch(setOrderDate(value));
        break;
      default:
        break;
    }
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async () => {
    if (!challan.customer || challan.products.length === 0) {
      alert('Select customer and add at least one product.');
      return;
    }

    const selectedCustomer = customers.find((c) => c._id === challan.customer);

    const challanDataSave = {
      customer: challan.customer,
      challanNo: challan.challanNo,
      challanDate: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      challanProducts: challan.products,
      shipTo: sameAsBillTo
        ? null
        : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
    };

    await dispatch(sendChallanData(challanDataSave));

    const pdfData = {
      customer: selectedCustomer,
      challanNo: challan.challanNo,
      date: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      products: challan.products,
      shipTo: sameAsBillTo
        ? null
        : { name: shipToName, address: shipToAddress, gstNo: shipToGst },
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
    };

    generateChallanPDF(pdfData);
    navigate('/challans/all');
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>Delivery Challan</h2>

      {/* NOTE: using div not form since submit is manual via button */}
      <div
        className='invoice-form'
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        {/* Customer */}
        <div className='form-group'>
          <label className='form-label'>Customer</label>
          <select
            className='form-select'
            value={challan.customer}
            onChange={(e) => dispatch(setChallanCustomer(e.target.value))}
          >
            <option value=''>Select</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ship To Same */}
        <div className='form-group checkbox-group'>
          <label>
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
            <div className='form-group'>
              <label className='form-label'>Ship To Name</label>
              <input
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
                className='form-input'
                value={shipToGst}
                onChange={(e) => setShipToGst(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Challan No */}
        <div className='form-group'>
          <label className='form-label'>Challan No</label>
          <input className='form-input' value={challan.challanNo} disabled />
        </div>

        {/* Challan Date */}
        <div className='form-group'>
          <label className='form-label'>Challan Date</label>
          <input
            type='date'
            className='form-input'
            name='challanDate'
            value={challan.challanDate}
            onChange={handleChange}
          />
        </div>

        {/* Order No */}
        <div className='form-group'>
          <label className='form-label'>Order No</label>
          <input
            className='form-input'
            name='orderNo'
            value={challan.orderNo}
            onChange={handleChange}
          />
        </div>

        {/* Order Date */}
        <div className='form-group'>
          <label className='form-label'>Order Date</label>
          <input
            type='date'
            className='form-input'
            name='orderDate'
            value={challan.orderDate}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Products Table */}
      <h3 className='products-header'>Products</h3>

      <table className='products-table'>
        <thead>
          <tr>
            <th>Name</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>UOM</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {challan.products.map((p, i) => (
            <tr key={i}>
              {/* ✅ textarea with Tab support */}
              <td>
                <textarea
                  className='table-input table-textarea'
                  value={p.name}
                  rows={3}
                  onChange={(e) =>
                    dispatch(
                      updateChallanProduct({
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
                        updateChallanProduct({
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
                />
              </td>

              <td>
                <input
                  className='table-input'
                  value={p.hsn || ''}
                  onChange={(e) =>
                    dispatch(
                      updateChallanProduct({
                        index: i,
                        updatedFields: { hsn: e.target.value },
                      }),
                    )
                  }
                />
              </td>

              <td>
                <input
                  type='number'
                  className='table-input'
                  value={p.quantity}
                  onChange={(e) =>
                    dispatch(
                      updateChallanProduct({
                        index: i,
                        updatedFields: { quantity: e.target.value },
                      }),
                    )
                  }
                />
              </td>

              <td>
                <select
                  className='table-select'
                  value={p.uom}
                  onChange={(e) =>
                    dispatch(
                      updateChallanProduct({
                        index: i,
                        updatedFields: { uom: e.target.value },
                      }),
                    )
                  }
                >
                  {uomList.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <button
                  className='remove-btn'
                  onClick={() => dispatch(removeChallanProduct(i))}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Product */}
      <div className='product-input-group'>
        {/* ✅ textarea with Tab support */}
        <div className='form-group'>
          <label className='form-label'>Product Name</label>
          <textarea
            ref={nameTextareaRef}
            className='form-input product-name-textarea'
            placeholder={'Product name\n    Tab to indent details'}
            value={newProduct.name}
            rows={4}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            onKeyDown={handleNewProductNameKeyDown}
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>HSN Code</label>
          <input
            className='form-input'
            placeholder='HSN'
            value={newProduct.hsn}
            onChange={(e) =>
              setNewProduct({ ...newProduct, hsn: e.target.value })
            }
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Quantity</label>
          <input
            type='number'
            className='form-input'
            placeholder='Qty'
            value={newProduct.quantity}
            onChange={(e) =>
              setNewProduct({ ...newProduct, quantity: e.target.value })
            }
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>UOM</label>
          <select
            className='form-select'
            value={newProduct.uom}
            onChange={(e) =>
              setNewProduct({ ...newProduct, uom: e.target.value })
            }
          >
            {uomList.map((uom) => (
              <option key={uom} value={uom}>
                {uom}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ type="button" prevents accidental submit */}
        <button type='button' className='add-btn' onClick={handleAddProduct}>
          Add
        </button>
      </div>

      <div className='form-actions'>
        {/* ✅ type="button" since submit is handled manually */}
        <button type='button' className='save-challan' onClick={handleSubmit}>
          SAVE & GENERATE PDF
        </button>
      </div>
    </div>
  );
};

export default ChallanForm;
