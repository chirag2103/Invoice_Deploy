import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCustomers = createAsyncThunk('customers/fetch', async () => {
  try {
    const response = await axios.get('https://invoice-deploy.onrender.com/api/customers');
    console.log(response.data);
    return response.data.customers;
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    throw error;
  }
});

const initialState = {
  customers: [],
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
      });
  },
});

export default customerSlice.reducer;
