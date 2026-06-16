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
  invoiceDiscount: 0,
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

const lineAmount = (p) =>
  Number(p.quantity || 0) * Number(p.rate || 0) * (1 - (Number(p.discount) || 0) / 100);

const recalc = (state) => {
  state.totalAmount = state.products.reduce((sum, p) => sum + lineAmount(p), 0);
  const taxable = Math.max(state.totalAmount - (state.invoiceDiscount || 0), 0);
  state.grandTotal = Math.round(taxable + taxable * (state.gst * 2) / 100);
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
      recalc(state);
    },
    setGstType(state, action) {
      state.gstType = action.payload;
      recalc(state);
    },
    setInvoiceDiscount(state, action) {
      state.invoiceDiscount = Number(action.payload) || 0;
      recalc(state);
    },
    addProduct(state, action) {
      state.products.push({
        name: action.payload.name,
        hsn: action.payload.hsn || '',
        quantity: action.payload.quantity,
        rate: action.payload.rate,
        discount: Number(action.payload.discount) || 0,
        uom: action.payload.uom || 'NOS',
      });
      recalc(state);
    },
    removeProduct(state, action) {
      state.products.splice(action.payload, 1);
      recalc(state);
    },
    updateProduct: (state, action) => {
      const { index, updatedFields } = action.payload;
      if (!state.products[index]) return;
      state.products[index] = { ...state.products[index], ...updatedFields };
      recalc(state);
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
  setInvoiceDiscount,
  addProduct,
  removeProduct,
  updateProduct,
  clearPoData,
} = poSlice.actions;

export default poSlice.reducer;
