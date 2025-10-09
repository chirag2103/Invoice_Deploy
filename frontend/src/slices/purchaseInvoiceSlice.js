import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const initialState = {
  purchaseInvoices: [],
  error: null,
  loading: false,
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchPurchaseInvoices = createAsyncThunk(
  'purchaseInvoice/fetchPurchaseInvoices',
  async (sellerId = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiUrl}/api/purchase/get/all`;

      if (sellerId) {
        url = `${apiUrl}/api/seller/${sellerId}/purchaseinvoices`;
      }

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.purchases;
    } catch (error) {
      throw error;
    }
  }
);

export const addPurchaseInvoice = createAsyncThunk(
  'purchaseInvoice/addPurchaseInvoice',
  async (purchaseInvoiceData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `${apiUrl}/api/purchaseinvoices`,
        purchaseInvoiceData,
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

export const deletePurchaseInvoice = createAsyncThunk(
  'purchaseInvoice/deletePurchaseInvoice',
  async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(
        `${apiUrl}/api/purchaseinvoices/${id}`,
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
        state.purchaseInvoices = action.payload;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseInvoices.push(action.payload.purchaseInvoice);
        state.message = action.payload.message;
      })
      .addCase(addPurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deletePurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseInvoices = state.purchaseInvoices.filter(
          (purchaseInvoice) => purchaseInvoice._id !== action.payload.id
        );
        state.message = action.payload.message;
      })
      .addCase(deletePurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearPurchaseInvoiceMessage } = purchaseInvoiceSlice.actions;
export default purchaseInvoiceSlice.reducer;
