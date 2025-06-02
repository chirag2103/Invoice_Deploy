import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import TableHOC from '../components/TableHOC';
import AdminSidebar from '../components/AdminSidebar';
import userImg from '../assets/userpic.png';
import { BsSearch } from 'react-icons/bs';
import { FaRegBell } from 'react-icons/fa';
import { BarChart1 } from '../components/Charts';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Error deleting product');
      }
    }
  };

  const columns = [
    {
      Header: 'Name',
      accessor: 'name',
    },
    {
      Header: 'Description',
      accessor: 'description',
    },
    {
      Header: 'Price',
      accessor: 'price',
      Cell: ({ value }) => `₹${value.toFixed(2)}`,
    },
    {
      Header: 'Stock',
      accessor: 'stock',
      Cell: ({ value }) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value > 10
              ? 'bg-green-100 text-green-800'
              : value > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      Header: 'Actions',
      accessor: '_id',
      Cell: ({ row }) => (
        <div className='space-x-2'>
          <Link
            to={`/products/edit/${row.original._id}`}
            className='text-blue-600 hover:text-blue-800'
          >
            Edit
          </Link>
          <button
            onClick={() => deleteProduct(row.original._id)}
            className='text-red-600 hover:text-red-800'
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const Table = TableHOC(
    columns,
    products,
    'Products List',
    'products-table',
    loading
  );

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='p-5'>
        <div className='flex justify-between items-center mb-5'>
          <h2 className='text-2xl font-bold'>Products</h2>
          <Link
            to='/products/new'
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Add New Product
          </Link>
        </div>
        {Table}
      </main>
    </div>
  );
};

export default Products;
