import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const apiUrl = process.env.REACT_APP_API_URL;

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
  proformaNo: 1,
  financialYearLabel: '',
  currentFinancialYear: '',
  availableFinancialYears: [],
  customer: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 9,
  gstType: 'intraState',
  error: null,
  loading: false,
  proformas: [],
  pagination: initialPagination,
  message: '',
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const calculateGrandTotal = (totalAmount, gst) => {
  return Math.round(totalAmount + (totalAmount * gst * 2) / 100);
};

export const fetchProformaInvoices = createAsyncThunk(
  'proforma/fetchProformaInvoices',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/proformas`, {
        params: payload,
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch proforma invoices'
      );
    }
  }
);

export const fetchProformaNo = createAsyncThunk(
  'proforma/fetchProformaNo',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/lastproforma`, {
        params: date ? { date } : {},
        headers: getAuthHeaders(),
      });
      return res.data.proforma;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch next proforma number'
      );
    }
  }
);

export const deleteProformaInvoice = createAsyncThunk(
  'proforma/deleteProformaInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`${apiUrl}/api/proforma/${id}`, {
        headers: getAuthHeaders(),
      });
      return { id, message: res.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete proforma invoice'
      );
    }
  }
);

const proformaSlice = createSlice({
  name: 'proforma',
  initialState,
  reducers: {
    setCustomer(state, action) {
      state.customer = action.payload;
    },

    setGst(state, action) {
      state.gst = action.payload;
      state.grandTotal = calculateGrandTotal(state.totalAmount, state.gst);
    },

    setGstType(state, action) {
      state.gstType = action.payload;
      state.grandTotal = calculateGrandTotal(state.totalAmount, state.gst);
    },

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

      state.grandTotal = calculateGrandTotal(state.totalAmount, state.gst);
    },

    removeProduct(state, action) {
      state.products.splice(action.payload, 1);

      state.totalAmount = state.products.reduce(
        (sum, p) => sum + p.quantity * p.rate,
        0
      );

      state.grandTotal = calculateGrandTotal(state.totalAmount, state.gst);
    },

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

      state.grandTotal = calculateGrandTotal(state.totalAmount, state.gst);
    },

    clearAllData() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProformaInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProformaInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.proformas = action.payload.proformas || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.availableFinancialYears = action.payload.availableFinancialYears || [];
        state.currentFinancialYear = action.payload.currentFinancialYear || '';
      })
      .addCase(fetchProformaInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchProformaNo.fulfilled, (state, action) => {
        state.proformaNo = action.payload.proformaNo;
        state.financialYearLabel = action.payload.financialYearLabel || '';
      })
      .addCase(deleteProformaInvoice.fulfilled, (state, action) => {
        state.proformas = state.proformas.filter(
          (p) => p._id !== action.payload.id
        );
        state.message = action.payload.message;
      });
  },
});

export const {
  setCustomer,
  setGst,
  setGstType,
  addProduct,
  removeProduct,
  updateProduct,
  clearAllData,
} = proformaSlice.actions;

export default proformaSlice.reducer;
