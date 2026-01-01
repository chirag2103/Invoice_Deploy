import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const apiUrl = process.env.REACT_APP_API_URL;

const initialState = {
  billNo: 1,
  customer: '',
  date: '',
  products: [], // { name, hsn, quantity, rate, uom }
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  error: null,
  loading: false,
  invoices: [],
  message: '',
};

// -------------------- Async Thunks --------------------

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async (id = null) => {
    const token = localStorage.getItem('token');

    if (id == null) {
      const res = await api.get(`${apiUrl}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.invoices;
    } else {
      const res = await api.get(`${apiUrl}/api/customer/${id}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.invoices;
    }
  }
);

export const fetchBillNo = createAsyncThunk('invoice/fetchBillNo', async () => {
  const token = localStorage.getItem('token');
  const res = await api.get(`${apiUrl}/api/lastinvoice`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseInt(res.data.invoice.invoiceNo);
});

export const deleteInvoice = createAsyncThunk(
  'invoice/deleteInvoice',
  async (id) => {
    const token = localStorage.getItem('token');
    const res = await api.delete(`${apiUrl}/api/invoice/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.message;
  }
);

// -------------------- Slice --------------------

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setCustomer(state, action) {
      state.customer = action.payload;
    },

    setGst(state, action) {
      state.gst = action.payload;
      // recalc when GST changes
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    // ✅ ADD PRODUCT (HSN supported)
    addProduct(state, action) {
      state.products.push({
        name: action.payload.name,
        hsn: action.payload.hsn || '',
        quantity: action.payload.quantity,
        rate: action.payload.rate,
        uom: action.payload.uom || 'NOS',
      });

      state.totalAmount = state.products.reduce(
        (sum, p) => sum + p.quantity * p.rate,
        0
      );

      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    // ✅ REMOVE PRODUCT
    removeProduct(state, action) {
      state.products.splice(action.payload, 1);

      state.totalAmount = state.products.reduce(
        (sum, p) => sum + p.quantity * p.rate,
        0
      );

      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    // ✅ UPDATE PRODUCT (HSN INCLUDED)
    updateProduct(state, action) {
      const { index, updatedFields } = action.payload;
      if (!state.products[index]) return;

      state.products[index] = {
        ...state.products[index],
        ...updatedFields,
      };

      state.totalAmount = state.products.reduce(
        (sum, p) => sum + p.quantity * p.rate,
        0
      );

      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    clearAllData() {
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
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchBillNo.fulfilled, (state, action) => {
        state.billNo = action.payload + 1;
      });
  },
});

export const {
  setCustomer,
  setGst,
  addProduct,
  removeProduct,
  updateProduct,
  clearAllData,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
