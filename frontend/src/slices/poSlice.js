import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const initialState = {
  poNo: 1,
  seller: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  error: null,
  loading: false,
  pos: [],
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchPOs = createAsyncThunk('po/fetchpos', async () => {
  const token = localStorage.getItem('token');

  const res = await api.get(`${apiUrl}/api/pos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.po;
});

export const fetchLastPO = createAsyncThunk(
  'quotation/fetchQuoteNo',
  async () => {
    const token = localStorage.getItem('token');

    const res = await api.get(`${apiUrl}/api/lastpo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return parseInt(res.data.po.poNo);
  }
);

export const sendPOData = createAsyncThunk(
  'quotation/sendPOData',
  async (data) => {
    const token = localStorage.getItem('token');

    const res = await api.post(`${apiUrl}/api/po/new`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  }
);

const poSlice = createSlice({
  name: 'po',
  initialState,
  reducers: {
    setSeller(state, action) {
      state.seller = action.payload;
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

    clearPoData(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPOs.fulfilled, (state, action) => {
        state.pos = action.payload;
      })
      .addCase(fetchLastPO.fulfilled, (state, action) => {
        state.poNo = action.payload + 1;
      })
      .addCase(sendPOData.fulfilled, (state, action) => {
        state.message = 'PO saved successfully';
      });
  },
});

export const {
  setSeller,
  setGst,
  addProduct,
  removeProduct,
  updateProduct,
  clearPoData,
} = poSlice.actions;

export default poSlice.reducer;
