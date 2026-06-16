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
  quoteNo: 1,
  financialYearLabel: '',
  currentFinancialYear: '',
  availableFinancialYears: [],
  customer: '',
  date: '',
  products: [],
  totalAmount: 0,
  invoiceDiscount: 0,
  grandTotal: 0,
  gst: 9,
  gstType: 'intraState',
  error: null,
  loading: false,
  quotations: [],
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

export const fetchQuotations = createAsyncThunk(
  'quotation/fetchQuotations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/quotations`, {
        params,
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch quotations'
      );
    }
  }
);

export const fetchQuoteNo = createAsyncThunk(
  'quotation/fetchQuoteNo',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/lastquotation`, {
        params: date ? { date } : {},
        headers: getAuthHeaders(),
      });
      return res.data.quotation;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch next quotation number'
      );
    }
  }
);

export const sendQuotationData = createAsyncThunk(
  'quotation/sendQuotationData',
  async (data) => {
    const res = await api.post(`${apiUrl}/api/quotation/new`, data, {
      headers: getAuthHeaders(),
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
    clearQuotationData(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload.quotations || [];
        state.pagination = action.payload.pagination || initialPagination;
        state.availableFinancialYears = action.payload.availableFinancialYears || [];
        state.currentFinancialYear = action.payload.currentFinancialYear || '';
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchQuoteNo.fulfilled, (state, action) => {
        state.quoteNo = action.payload.quoteNo;
        state.financialYearLabel = action.payload.financialYearLabel || '';
      })
      .addCase(sendQuotationData.fulfilled, (state) => {
        state.message = 'Quotation saved successfully';
      });
  },
});

export const {
  setCustomer,
  setGst,
  setGstType,
  setInvoiceDiscount,
  addProduct,
  removeProduct,
  updateProduct,
  clearQuotationData,
} = quotationSlice.actions;

export default quotationSlice.reducer;
