import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const initialState = {
  payments: [],
  error: null,
  loading: false,
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async (customerId = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiUrl}/api/payments`;

      if (customerId) {
        url = `${apiUrl}/api/customer/${customerId}/payments`;
      }

      const response = await api.get(url, {
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

export const addPayment = createAsyncThunk(
  'payment/addPayment',
  async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`${apiUrl}/api/payments`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const deletePayment = createAsyncThunk(
  'payment/deletePayment',
  async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`${apiUrl}/api/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { id, message: response.data.message };
    } catch (error) {
      throw error;
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
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.push(action.payload.payment);
        state.message = action.payload.message;
      })
      .addCase(addPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deletePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = state.payments.filter(
          (payment) => payment._id !== action.payload.id
        );
        state.message = action.payload.message;
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearPaymentMessage } = paymentSlice.actions;
export default paymentSlice.reducer;
