import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/axios';

const initialState = {
  billNo: 1,
  customer: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  error: null,
  loading: false,
  invoices: [],
  message: '',
};

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async (id = null, { rejectWithValue }) => {
    try {
      if (id == null) {
        const response = await api.get('/invoices');
        console.log('Fetched invoices:', response.data);
        return response.data.invoices;
      } else {
        const response = await api.get(`/customer/${id}/invoices`);
        return response.data.invoices;
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoices'
      );
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoice/deleteInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/invoice/${id}`);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete invoice'
      );
    }
  }
);

export const fetchBillNo = createAsyncThunk(
  'invoice/fetchBillNo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/lastinvoice');
      return parseInt(response.data.invoice.invoiceNo);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bill number'
      );
    }
  }
);

export const sendInvoiceData = createAsyncThunk(
  'invoice/sendInvoiceData',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/invoice/new', invoiceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send invoice data'
      );
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setCustomer(state, action) {
      state.customer = action.payload;
    },
    setGst(state, action) {
      state.gst = action.payload;
    },
    addProduct(state, action) {
      state.products.push(action.payload);
      state.totalAmount += action.payload.quantity * action.payload.rate;
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },
    removeProduct(state, action) {
      const removedProduct = state.products.splice(action.payload, 1)[0];
      state.totalAmount -= removedProduct.quantity * removedProduct.rate;
      state.grandTotal =
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100;
    },
    clearAllData(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBillNo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillNo.fulfilled, (state, action) => {
        state.loading = false;
        state.billNo = action.payload + 1;
        state.error = null;
      })
      .addCase(fetchBillNo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendInvoiceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendInvoiceData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendInvoiceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCustomer, setGst, addProduct, removeProduct, clearAllData } =
  invoiceSlice.actions;

export default invoiceSlice.reducer;
