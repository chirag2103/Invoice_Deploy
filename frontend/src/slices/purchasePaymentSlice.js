import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';
import { initialPagination } from '../constants/pagination.js';

const apiUrl = process.env.REACT_APP_API_URL;

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
      .addCase(fetchPurchasePayments.pending, (state, action) => {
        state.fetchPurchasePaymentsRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchasePayments.fulfilled, (state, action) => {
        if (state.fetchPurchasePaymentsRequestId && state.fetchPurchasePaymentsRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.purchasePayments = action.payload.payments || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.paidAmount = action.payload.paidAmount || 0;
      })
      .addCase(fetchPurchasePayments.rejected, (state, action) => {
        if (state.fetchPurchasePaymentsRequestId && state.fetchPurchasePaymentsRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearPurchasePaymentMessage } = purchasePaymentSlice.actions;
export default purchasePaymentSlice.reducer;
