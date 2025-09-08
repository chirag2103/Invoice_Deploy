import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  purchasePayments: [],
  error: null,
  loading: false,
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchPurchasePayments = createAsyncThunk(
  'purchasePayment/fetchPurchasePayments',
  async (sellerId = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiUrl}/api/purchase/payments`;

      if (sellerId) {
        url = `${apiUrl}/api/purchase/payment/seller/${sellerId}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.payments;
    } catch (error) {
      throw error;
    }
  }
);

export const addPurchasePayment = createAsyncThunk(
  'purchasePayment/addPurchasePayment',
  async (purchasePaymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${apiUrl}/api/purchasepayments`,
        purchasePaymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const deletePurchasePayment = createAsyncThunk(
  'purchasePayment/deletePurchasePayment',
  async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${apiUrl}/api/purchasepayments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { id, message: response.data.message };
    } catch (error) {
      throw error;
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
        state.purchasePayments = action.payload;
      })
      .addCase(fetchPurchasePayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPurchasePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPurchasePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.purchasePayments.push(action.payload.purchasePayment);
        state.message = action.payload.message;
      })
      .addCase(addPurchasePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deletePurchasePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchasePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.purchasePayments = state.purchasePayments.filter(
          (purchasePayment) => purchasePayment._id !== action.payload.id
        );
        state.message = action.payload.message;
      })
      .addCase(deletePurchasePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearPurchasePaymentMessage } = purchasePaymentSlice.actions;
export default purchasePaymentSlice.reducer;
