import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const initialState = {
  quoteNo: 1,
  customer: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  error: null,
  loading: false,
  quotations: [],
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchQuotations = createAsyncThunk(
  'quotation/fetchQuotations',
  async () => {
    const token = localStorage.getItem('token');

    const res = await api.get(`${apiUrl}/api/quotations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.quotations;
  }
);

export const fetchQuoteNo = createAsyncThunk(
  'quotation/fetchQuoteNo',
  async () => {
    const token = localStorage.getItem('token');

    const res = await api.get(`${apiUrl}/api/lastquotation`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return parseInt(res.data.quotation.quoteNo);
  }
);

export const sendQuotationData = createAsyncThunk(
  'quotation/sendQuotationData',
  async (data) => {
    const token = localStorage.getItem('token');

    const res = await api.post(`${apiUrl}/api/quotation/new`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  }
);

const quotationSlice = createSlice({
  name: 'quotation',
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
      const removed = state.products.splice(action.payload, 1)[0];
      state.totalAmount -= removed.quantity * removed.rate;
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },
    updateProduct: (state, action) => {
      const { index, updatedFields } = action.payload;
      const product = state.products[index];

      if (!product) return;

      const updatedProduct = { ...product, ...updatedFields };
      state.products[index] = updatedProduct;

      // Recalculate totals
      state.totalAmount = state.products.reduce(
        (sum, prod) => sum + prod.quantity * prod.rate,
        0
      );
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    clearQuotationData(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.quotations = action.payload;
      })
      .addCase(fetchQuoteNo.fulfilled, (state, action) => {
        state.quoteNo = action.payload + 1;
      })
      .addCase(sendQuotationData.fulfilled, (state, action) => {
        state.message = 'Quotation saved successfully';
      });
  },
});

export const {
  setCustomer,
  setGst,
  addProduct,
  removeProduct,
  updateProduct,
  clearQuotationData,
} = quotationSlice.actions;

export default quotationSlice.reducer;
