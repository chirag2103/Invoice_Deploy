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
  billNo: 1,
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
  invoices: [],
  pagination: initialPagination,
  customerTotal: 0,
  customerName: '',
  message: '',
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const params =
        typeof payload === 'string' ? { customerId: payload } : payload;
      const { customerId, ...query } = params || {};
      const url = customerId
        ? `${apiUrl}/api/customer/${customerId}/invoices`
        : `${apiUrl}/api/invoices`;

      const res = await api.get(url, {
        params: query,
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoices'
      );
    }
  }
);

export const fetchBillNo = createAsyncThunk(
  'invoice/fetchBillNo',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/lastinvoice`, {
        params: date ? { date } : {},
        headers: getAuthHeaders(),
      });
      return res.data.invoice;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch next invoice number'
      );
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoice/deleteInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`${apiUrl}/api/invoice/${id}`, {
        headers: getAuthHeaders(),
      });
      return { id, message: res.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete invoice'
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
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

    setGstType(state, action) {
      state.gstType = action.payload;
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

      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },

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
        state.invoices = action.payload.invoices || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.customerTotal = action.payload.total || 0;
        state.customerName = action.payload.customerName || '';
        state.availableFinancialYears = action.payload.availableFinancialYears || [];
        state.currentFinancialYear = action.payload.currentFinancialYear || '';
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchBillNo.fulfilled, (state, action) => {
        state.billNo = action.payload.invoiceNo;
        state.financialYearLabel = action.payload.financialYearLabel || '';
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter(
          (invoice) => invoice._id !== action.payload.id
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
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
