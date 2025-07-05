import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setChallanCustomer,
  setChallanDate,
  setChallanNo,
  setOrderNo,
  setOrderDate,
  addChallanProduct,
  removeChallanProduct,
  fetchChallanNo,
} from '../slices/challanSlice';
import { fetchCustomers } from '../slices/customerSlice';
import '../styles/InvoiceForm.css';
import { useNavigate } from 'react-router-dom';
import { sendChallanData } from '../slices/challanSlice';

const ChallanForm = () => {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.customers);
  const challan = useSelector((state) => state.challan);

  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    uom: 'NOS',
  });

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchChallanNo());
  }, [dispatch]);

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.quantity && newProduct.uom) {
      dispatch(addChallanProduct(newProduct));
      setNewProduct({ name: '', quantity: '', uom: 'NOS' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'challanNo') dispatch(setChallanNo(value));
    else if (name === 'challanDate') dispatch(setChallanDate(value));
    else if (name === 'orderNo') dispatch(setOrderNo(value));
    else if (name === 'orderDate') dispatch(setOrderDate(value));
  };

  const navigate = useNavigate();

  const handleSubmit = () => {
    const selectedCustomer = customers.find((c) => c._id === challan.customer);
    const challanData = {
      customer: selectedCustomer, // for printing
      billNo: challan.challanNo,
      date: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      products: challan.products,
      invoicefor: 'Challan',
    };
    const challanDataSave = {
      customer: challan.customer,
      challanNo: challan.challanNo,
      challanDate: challan.challanDate,
      orderNo: challan.orderNo,
      orderDate: challan.orderDate,
      challanProducts: challan.products,
    };

    dispatch(sendChallanData(challanDataSave)).then(() => {
      navigate('/invoices/preview', { state: challanData });
    });
  };

  return (
    <div className='invoice-container'>
      <h2 className='invoice-header'>Challan Form</h2>
      <div className='invoice-form'>
        <div className='form-group'>
          <label className='form-label'>Customer</label>
          <select
            className='form-select'
            value={challan.customer}
            onChange={(e) => dispatch(setChallanCustomer(e.target.value))}
          >
            <option value=''>Select Customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className='form-group'>
          <label className='form-label'>Challan Number</label>
          <input
            type='text'
            className='form-input'
            name='challanNo'
            value={challan.challanNo}
            disabled
          />
        </div>

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

        <div className='form-group'>
          <label className='form-label'>Order Number</label>
          <input
            type='text'
            className='form-input'
            name='orderNo'
            value={challan.orderNo}
            onChange={handleChange}
          />
        </div>

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

      <h3 className='products-header'>Products</h3>
      <table className='products-table'>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>UOM</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {challan.products.length === 0 ? (
            <tr>
              <td colSpan='4' className='no-products'>
                No products added
              </td>
            </tr>
          ) : (
            challan.products.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.quantity}</td>
                <td>{p.uom}</td>
                <td>
                  <button
                    className='remove-btn'
                    onClick={() => dispatch(removeChallanProduct(i))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className='product-input-group'>
        <div className='form-group'>
          <label className='form-label'>Product Name</label>
          <input
            type='text'
            className='form-input'
            placeholder='Product Name'
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Quantity</label>
          <input
            type='number'
            className='form-input'
            placeholder='Quantity'
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
            <option value='NOS'>NOS</option>
            <option value='PCS'>PCS</option>
            <option value='BOX'>BOX</option>
            <option value='MTR'>MTR</option>
            <option value='KG'>KG</option>
          </select>
        </div>

        <div className='form-group' style={{ marginTop: '28px' }}>
          <button className='add-btn' onClick={handleAddProduct}>
            Add Product
          </button>
        </div>
      </div>
      <div className='form-actions'>
        <button type='button' className='save-challan' onClick={handleSubmit}>
          ADD CHALLAN
        </button>
      </div>
    </div>
  );
};

export default ChallanForm;
