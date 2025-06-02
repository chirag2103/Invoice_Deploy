import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const QuotationForm = ({ customers, products, initialData, onSubmit }) => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState(
    initialData || {
      customer: '',
      items: [{ product: '', quantity: 1, price: 0, amount: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
      validUntil: '',
      notes: '',
      terms: '',
      status: 'draft',
    }
  );

  const calculateItemAmount = (item) => {
    return item.quantity * item.price;
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const calculateTotal = (subtotal, tax) => {
    return subtotal + (subtotal * tax) / 100;
  };

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customer: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      amount:
        field === 'quantity' || field === 'price'
          ? calculateItemAmount({
              ...updatedItems[index],
              [field]: value,
            })
          : updatedItems[index].amount,
    };

    const subtotal = calculateSubtotal(updatedItems);
    const total = calculateTotal(subtotal, formData.tax);

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total,
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product: '', quantity: 1, price: 0, amount: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = calculateSubtotal(updatedItems);
    const total = calculateTotal(subtotal, formData.tax);

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total,
    });
  };

  const handleTaxChange = (e) => {
    const tax = parseFloat(e.target.value) || 0;
    const total = calculateTotal(formData.subtotal, tax);

    setFormData({
      ...formData,
      tax,
      total,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      toast.error('Please select a customer');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (formData.items.some((item) => !item.product || item.quantity <= 0)) {
      toast.error('Please fill in all item details correctly');
      return;
    }

    if (!formData.validUntil) {
      toast.error('Please select a valid until date');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Customer
          </label>
          <select
            value={formData.customer}
            onChange={handleCustomerChange}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value=''>Select Customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Valid Until
          </label>
          <input
            type='date'
            value={formData.validUntil}
            onChange={(e) =>
              setFormData({ ...formData, validUntil: e.target.value })
            }
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-medium'>Items</h3>
          <button
            type='button'
            onClick={handleAddItem}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Add Item
          </button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            <div className='md:col-span-2'>
              <select
                value={item.product}
                onChange={(e) =>
                  handleItemChange(index, 'product', e.target.value)
                }
                className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value=''>Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type='number'
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, 'quantity', parseInt(e.target.value))
                }
                min='1'
                className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                placeholder='Quantity'
              />
            </div>
            <div>
              <input
                type='number'
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, 'price', parseFloat(e.target.value))
                }
                min='0'
                step='0.01'
                className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                placeholder='Price'
              />
            </div>
            <div className='flex items-center justify-between'>
              <span>₹{item.amount.toFixed(2)}</span>
              <button
                type='button'
                onClick={() => handleRemoveItem(index)}
                className='text-red-600 hover:text-red-800'
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows='3'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          ></textarea>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Terms & Conditions
          </label>
          <textarea
            value={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.value })
            }
            rows='3'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          ></textarea>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value='draft'>Draft</option>
            <option value='sent'>Sent</option>
            <option value='accepted'>Accepted</option>
            <option value='rejected'>Rejected</option>
            <option value='expired'>Expired</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Tax Rate (%)
          </label>
          <input
            type='number'
            value={formData.tax}
            onChange={handleTaxChange}
            min='0'
            step='0.01'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>
      </div>

      <div className='flex justify-end space-x-4 text-lg'>
        <div>Subtotal: ₹{formData.subtotal.toFixed(2)}</div>
        <div>Tax: ₹{((formData.subtotal * formData.tax) / 100).toFixed(2)}</div>
        <div className='font-bold'>Total: ₹{formData.total.toFixed(2)}</div>
      </div>

      <div className='flex justify-end'>
        <button
          type='submit'
          className='px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          {initialData ? 'Update Quotation' : 'Create Quotation'}
        </button>
      </div>
    </form>
  );
};

export default QuotationForm;
