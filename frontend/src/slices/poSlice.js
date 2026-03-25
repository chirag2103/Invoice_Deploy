import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

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
  pagination: initialPagination,
  message: '',
};

const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const fetchPOs = createAsyncThunk(
  'po/fetchpos',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/pos`, {
        params,
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch purchase orders'
      );
    }
  }
);

export const fetchLastPO = createAsyncThunk('quotation/fetchQuoteNo', async () => {
  const res = await api.get(`${apiUrl}/api/lastpo`, {
    headers: getAuthHeaders(),
  });
  return parseInt(res.data.po.poNo);
});

export const sendPOData = createAsyncThunk(
  'quotation/sendPOData',
  async (data) => {
    const res = await api.post(`${apiUrl}/api/po/new`, data, {
      headers: getAuthHeaders(),
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
      .addCase(fetchPOs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPOs.fulfilled, (state, action) => {
        state.loading = false;
        state.pos = action.payload.po || [];
        state.pagination = action.payload.pagination || initialPagination;
      })
      .addCase(fetchPOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchLastPO.fulfilled, (state, action) => {
        state.poNo = action.payload + 1;
      })
      .addCase(sendPOData.fulfilled, (state) => {
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
