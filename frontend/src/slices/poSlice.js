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
  financialYearLabel: '',
  currentFinancialYear: '',
  availableFinancialYears: [],
  seller: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  gstType: 'intraState',
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

const calculateGrandTotal = (totalAmount, gst, gstType) => {
  return Math.round(totalAmount + (totalAmount * gst * 2) / 100);
};

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

export const fetchPONo = createAsyncThunk(
  'po/fetchPONo',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/lastpo`, {
        params: date ? { date } : {},
        headers: getAuthHeaders(),
      });
      return res.data.po;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to fetch next purchase order number'
      );
    }
  }
);

export const sendPOData = createAsyncThunk(
  'po/sendPOData',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(`${apiUrl}/api/po/new`, data, {
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save purchase order'
      );
    }
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
      state.grandTotal = calculateGrandTotal(
        state.totalAmount,
        state.gst,
        state.gstType
      );
    },
    setGstType(state, action) {
      state.gstType = action.payload;
      state.grandTotal = calculateGrandTotal(
        state.totalAmount,
        state.gst,
        state.gstType
      );
    },
    addProduct(state, action) {
      state.products.push(action.payload);
      state.totalAmount += action.payload.quantity * action.payload.rate;
      state.grandTotal = calculateGrandTotal(
        state.totalAmount,
        state.gst,
        state.gstType
      );
    },
    removeProduct(state, action) {
      const removed = state.products.splice(action.payload, 1)[0];
      state.totalAmount -= removed.quantity * removed.rate;
      state.grandTotal = calculateGrandTotal(
        state.totalAmount,
        state.gst,
        state.gstType
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
      state.grandTotal = calculateGrandTotal(
        state.totalAmount,
        state.gst,
        state.gstType
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
        state.availableFinancialYears = action.payload.availableFinancialYears || [];
        state.currentFinancialYear = action.payload.currentFinancialYear || '';
      })
      .addCase(fetchPOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPONo.fulfilled, (state, action) => {
        state.poNo = action.payload.poNo;
        state.financialYearLabel = action.payload.financialYearLabel || '';
      })
      .addCase(fetchPONo.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(sendPOData.fulfilled, (state) => {
        state.message = 'PO saved successfully';
      })
      .addCase(sendPOData.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setSeller,
  setGst,
  setGstType,
  addProduct,
  removeProduct,
  updateProduct,
  clearPoData,
} = poSlice.actions;

export default poSlice.reducer;
