import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ChallanForm = ({ customers, products, initialData, onSubmit }) => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState(
    initialData || {
      customer: '',
      items: [{ product: '', quantity: 1 }],
      deliveryDate: '',
      transportInfo: '',
      status: 'pending',
      notes: '',
    }
  );

  const handleCustomerChange = (e) => {
    setFormData({ ...formData, customer: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setFormData({ ...formData, items: updatedItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1 }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
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

    if (!formData.deliveryDate) {
      toast.error('Please select a delivery date');
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
            Delivery Date
          </label>
          <input
            type='date'
            value={formData.deliveryDate}
            onChange={(e) =>
              setFormData({ ...formData, deliveryDate: e.target.value })
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
          <div key={index} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
            <div className='flex items-center space-x-4'>
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
            Transport Information
          </label>
          <textarea
            value={formData.transportInfo}
            onChange={(e) =>
              setFormData({ ...formData, transportInfo: e.target.value })
            }
            rows='3'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            placeholder='Enter vehicle number, transporter name, etc.'
          ></textarea>
        </div>
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
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        >
          <option value='pending'>Pending</option>
          <option value='delivered'>Delivered</option>
          <option value='cancelled'>Cancelled</option>
        </select>
      </div>

      <div className='flex justify-end'>
        <button
          type='submit'
          className='px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          {initialData ? 'Update Challan' : 'Create Challan'}
        </button>
      </div>
    </form>
  );
};

export default ChallanForm;
