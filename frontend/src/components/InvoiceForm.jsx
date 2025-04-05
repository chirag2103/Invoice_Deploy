import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCustomer,
  setGst,
  addProduct,
  removeProduct,
  fetchBillNo,
  updateInvoice,
  clearAllData,
} from '../slices/invoiceSlice.js';
import { fetchCustomers } from '../slices/customerSlice.js';
import '../styles/InvoiceForm.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const InvoiceForm = ({ editInvoice }) => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = location.state?.invoice ? true : false;
  const invoiceToEdit = location.state?.invoice;

  useEffect(() => {
    dispatch(fetchCustomers());
    if (!isEdit) dispatch(fetchBillNo());
  }, [dispatch, isEdit]);

  const { customers, loading, error } = useSelector((state) => state.customers);
  const { billNo, customer, gst, products, totalAmount, grandTotal } =
    useSelector((state) => state.invoice);

  const [name, setName] = useState('');
  const [date, setDate] = useState(isEdit ? invoiceToEdit.date : '');
  const [challanNo, setChallanNo] = useState(
    isEdit ? invoiceToEdit.challanNo : ''
  );
  const [uom, setUom] = useState('NOS');
  const [quantity, setQuantity] = useState(0);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (isEdit) {
      dispatch(setCustomer(invoiceToEdit.customer));
      dispatch(setGst(invoiceToEdit.gst));
      invoiceToEdit.invoiceProducts.forEach((product) =>
        dispatch(addProduct(product))
      );
    }
  }, [dispatch, isEdit, invoiceToEdit]);

  const handleCustomerChange = async (event) => {
    const selectedCustomerId = event.target.value;
    const selectedCustomerObject = await customers.find(
      (customer) => customer._id === selectedCustomerId
    );
    dispatch(setCustomer(selectedCustomerObject));
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
  };

  const handleProductNameChange = (event) => {
    setName(event.target.value);
  };

  const handleGstChange = (event) => {
    dispatch(setGst(event.target.value));
  };

  const handleChallanNoChange = (event) => {
    setChallanNo(event.target.value);
  };

  const handleQuantityChange = (event) => {
    setQuantity(Number(event.target.value));
  };

  const handleRateChange = (event) => {
    setRate(Number(event.target.value));
  };

  const handleUomChange = (event) => {
    setUom(event.target.value);
  };

  const handleAddProduct = () => {
    if (!name && !quantity && !rate && !date) {
      alert('Enter all fields');
    } else {
      dispatch(addProduct({ name, quantity, rate, uom, date }));
      setName('');
      setUom('NOS');
      setQuantity(0);
      setRate(0);
    }
  };

  const handleRemoveProduct = (index) => {
    dispatch(removeProduct(index));
  };

  const handleGeneratePdf = async () => {
    let invoicefor = 'Original Copy';
    const dataRecipient = {
      customer,
      billNo,
      gst,
      products,
      date,
      grandTotal,
      totalAmount,
      invoicefor,
      challanNo,
    };

    if (customer && products && date) {
      try {
        const res = await axios.post(`${apiUrl}/api/invoice/new`, {
          customer: customer._id,
          invoiceNo: billNo,
          gst,
          invoiceProducts: products,
          date,
          grandTotal,
          invoiceTotal: totalAmount,
          challanNo: challanNo ? challanNo : '',
        });
        console.log('Response: ' + res);
      } catch (error) {
        console.log(error);
      }

      navigate('/invoices/preview', { state: dataRecipient });
    } else alert('Select Customer or products');
  };

  const handleGeneratePdfVendor = () => {
    let invoicefor = 'Duplicate Copy';
    let date1 = date.toString().split('T')[0];
    const dataVendor = {
      customer,
      billNo: isEdit ? invoiceToEdit.invoiceNo : billNo,
      gst,
      products,
      date: date1,
      grandTotal,
      totalAmount,
      invoicefor,
      challanNo,
    };

    if (customer && products && date) {
      navigate('/invoices/preview', { state: dataVendor });
    } else alert('Select Customer or products');
  };

  const handleSaveInvoice = async () => {
    if (customer && products && date) {
      try {
        const res = await axios.put(
          `${apiUrl}/api/invoice/${invoiceToEdit._id}`,
          {
            customer: customer._id,
            gst,
            invoiceProducts: products,
            date,
            grandTotal,
            invoiceTotal: totalAmount,
            challanNo: challanNo ? challanNo : '',
          }
        );
        console.log('Response: ' + res);
      } catch (error) {
        console.log(error);
      }
      let invoicefor = 'Original Copy';
      let date1 = date.toString().split('T')[0];
      console.log('date1:' + date1);
      const dataRecipient = {
        customer,
        billNo: invoiceToEdit.invoiceNo,
        gst,
        products,
        date: date1,
        grandTotal,
        totalAmount,
        invoicefor,
        challanNo,
      };
      navigate('/invoices/preview', { state: dataRecipient });
    } else alert('Select Customer or products');
  };
  const handlePrintOnly = async () => {
    if (customer && products && date) {
      let invoicefor = 'Original Copy';
      let date1 = date.split('T')[0];
      const dataRecipient = {
        customer,
        billNo: invoiceToEdit.invoiceNo,
        gst,
        products,
        date: date1,
        grandTotal,
        totalAmount,
        invoicefor,
        challanNo,
      };
      navigate('/invoices/preview', { state: dataRecipient });
    } else alert('Select Customer or products');
  };

  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>
        {isEdit ? 'Edit Invoice' : 'Create Invoice'}
      </h2>
      <form className='invoice-form'>
        <div className='form-group'>
          <label htmlFor='customer' className='form-label'>
            Customer:
          </label>
          <select
            id='customer'
            className='form-select'
            value={customer ? customer._id : ''}
            onChange={handleCustomerChange}
            aria-required
          >
            <option value=''>select</option>
            {loading ? (
              <option value=''>Loading...</option>
            ) : error ? (
              <option value=''>Error: {error}</option>
            ) : (
              customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className='form-group'>
          <label htmlFor='billNo' className='form-label'>
            Bill No
          </label>
          <input
            type='text'
            id='billNo'
            className='form-input'
            value={isEdit ? invoiceToEdit.invoiceNo : billNo}
            disabled
          />
        </div>
        <div className='form-group'>
          <label htmlFor='challanNo' className='form-label'>
            Challan No
          </label>
          <input
            type='text'
            id='challanNO'
            className='form-input'
            value={challanNo}
            onChange={handleChallanNoChange}
          />
        </div>
        <div className='form-group'>
          <label htmlFor='gst' className='form-label'>
            GST
          </label>
          <select
            id='gst'
            className='form-select'
            value={gst}
            onChange={handleGstChange}
            required
          >
            <option disabled>select</option>
            <option value={6}>6%</option>
            <option value={9}>9%</option>
          </select>
        </div>
        <div className='form-group'>
          <label htmlFor='date' className='form-label'>
            Date:
          </label>
          <input
            type='date'
            placeholder={isEdit ? invoiceToEdit.date : date}
            id='date'
            className='form-input'
            value={isEdit ? invoiceToEdit.date : date}
            onChange={handleDateChange}
            style={{ width: '10rem' }}
            required
          />
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
              {products.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td>{product.quantity}</td>
                  <td>{product.uom}</td>
                  <td>{product.rate}</td>
                  <td>{product.quantity * product.rate}</td>
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
          <p className='no-products'>No products added yet.</p>
        )}
        <div className='form-group'>
          <label htmlFor='productName' className='form-label'>
            Product Name:
          </label>
          <input
            type='text'
            id='productName'
            className='form-input'
            value={name}
            onChange={handleProductNameChange}
          />
        </div>
        <div className='form-group'>
          <label htmlFor='uom' className='form-label'>
            UOM
          </label>
          <select
            id='uom'
            className='form-select'
            value={uom}
            onChange={handleUomChange}
          >
            <option value='NOS'>NOS</option>
            <option value='Kg'>Kg</option>
            <option value='Liters'>Liters</option>
            <option value='Set'>Set</option>
            <option value='Bunch'>Bunch</option>
          </select>
        </div>
        <div className='form-group'>
          <label htmlFor='quantity' className='form-label'>
            Quantity:
          </label>
          <input
            type='number'
            id='quantity'
            className='form-input'
            value={quantity}
            onChange={handleQuantityChange}
          />
        </div>
        <div className='form-group'>
          <label htmlFor='rate' className='form-label'>
            Rate:
          </label>
          <input
            type='number'
            id='rate'
            className='form-input'
            value={rate}
            onChange={handleRateChange}
          />
        </div>
        <button type='button' className='add-btn' onClick={handleAddProduct}>
          Add Product
        </button>
      </form>
      <div className='invoice-totals'>
        <p>
          Total Amount: <span>{totalAmount}</span>
        </p>
        <p>
          Grand Total: <span>{grandTotal}</span>
        </p>
      </div>
      <div className='form-actions'>
        {isEdit ? (
          <>
            <button
              type='button'
              className='save-btn'
              onClick={handleSaveInvoice}
            >
              Save Invoice
            </button>
            <button
              type='button'
              className='save-btn'
              onClick={handlePrintOnly}
            >
              Print Only
            </button>
          </>
        ) : (
          <button
            type='button'
            className='generate-btn'
            onClick={handleGeneratePdf}
          >
            Generate Pdf
          </button>
        )}
        <button
          type='button'
          className='generate-vendor-btn'
          onClick={handleGeneratePdfVendor}
        >
          Generate Pdf Vendor
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;
