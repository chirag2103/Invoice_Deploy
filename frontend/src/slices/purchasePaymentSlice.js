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
  purchasePayments: [],
  pagination: initialPagination,
  paidAmount: 0,
  error: null,
  loading: false,
  message: '',
};

export const fetchPurchasePayments = createAsyncThunk(
  'purchasePayment/fetchPurchasePayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { sellerId, ...query } = params;
      const url = sellerId
        ? `${apiUrl}/api/purchase/payment/seller/${sellerId}`
        : `${apiUrl}/api/purchase/payments`;
      const response = await api.get(url, {
        params: query,
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch purchase payments'
      );
    }
  }
);

const purchasePaymentSlice = createSlice({
  name: 'purchasePayment',
  initialState,
  reducers: {
    clearPurchasePaymentMessage(state) {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchasePayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchasePayments.fulfilled, (state, action) => {
        state.loading = false;
        state.purchasePayments = action.payload.payments || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.paidAmount = action.payload.paidAmount || 0;
      })
      .addCase(fetchPurchasePayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearPurchasePaymentMessage } = purchasePaymentSlice.actions;
export default purchasePaymentSlice.reducer;
