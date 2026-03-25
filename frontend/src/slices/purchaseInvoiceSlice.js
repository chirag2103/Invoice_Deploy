import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const initialPagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
  search: '',
};

const initialState = {
  purchaseInvoices: [],
  pagination: initialPagination,
  error: null,
  loading: false,
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const fetchPurchaseInvoices = createAsyncThunk(
  'purchaseInvoice/fetchPurchaseInvoices',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${apiUrl}/api/purchase/get/all`, {
        params,
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch purchase invoices'
      );
    }
  }
);

const purchaseInvoiceSlice = createSlice({
  name: 'purchaseInvoice',
  initialState,
  reducers: {
    clearPurchaseInvoiceMessage(state) {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseInvoices = action.payload.purchases || [];
        state.pagination = action.payload.pagination || initialPagination;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearPurchaseInvoiceMessage } = purchaseInvoiceSlice.actions;
export default purchaseInvoiceSlice.reducer;
