import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

export const fetchCustomers = createAsyncThunk('customers/fetch', async () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  try {
    // console.log(apiUrl);
    const response = await api.get(`${apiUrl}/api/customers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response.data);
    return response.data.customers;
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    throw error;
  }
});
export const fetchSellers = createAsyncThunk('sellers/fetch', async () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  try {
    // console.log(apiUrl);
    const response = await api.get(`${apiUrl}/api/sellers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response.data);
    return response.data.sellers;
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    throw error;
  }
});

const initialState = {
  customers: [],
  sellers: [],
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchSellers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(fetchSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default customerSlice.reducer;
