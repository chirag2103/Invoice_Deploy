import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

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
  payments: [],
  pagination: initialPagination,
  paidAmount: 0,
  customerName: '',
  error: null,
  loading: false,
  message: '',
};

export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { customerId, ...query } = params;
      const url = customerId
        ? `${apiUrl}/api/customer/${customerId}/payments`
        : `${apiUrl}/api/payments`;
      const response = await api.get(url, {
        params: query,
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payments'
      );
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentMessage(state) {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.paidAmount = action.payload.paidAmount || 0;
        state.customerName = action.payload.customerName || '';
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearPaymentMessage } = paymentSlice.actions;
export default paymentSlice.reducer;
