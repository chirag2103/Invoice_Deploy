import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';
import { fetchAllPages } from '../services/fetchAllPages';
import { initialPagination } from '../constants/pagination.js';

const apiUrl = process.env.REACT_APP_API_URL;

const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });
const sortByName = (items = []) =>
  [...items].sort((a, b) =>
    nameCollator.compare((a.name || '').trim(), (b.name || '').trim())
  );

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${apiUrl}/api/customers`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch customers'
      );
    }
  }
);

export const fetchSellers = createAsyncThunk(
  'customers/fetchSellers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${apiUrl}/api/sellers`, {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch sellers'
      );
    }
  }
);

export const fetchCustomersForPicker = createAsyncThunk(
  'customers/fetchCustomersForPicker',
  async (_, { rejectWithValue, signal }) => {
    try {
      return await fetchAllPages(`${apiUrl}/api/customers`, 'customers', { sort: 'name' }, signal);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load customers');
    }
  }
);

export const fetchSellersForPicker = createAsyncThunk(
  'customers/fetchSellersForPicker',
  async (_, { rejectWithValue, signal }) => {
    try {
      return await fetchAllPages(`${apiUrl}/api/sellers`, 'sellers', { sort: 'name' }, signal);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load sellers');
    }
  }
);

const initialState = {
  customers: [],
  customerOptions: [],
  sellerOptions: [],
  customerOptionsLoading: false,
  sellerOptionsLoading: false,
  customerOptionsError: null,
  sellerOptionsError: null,
  sellers: [],
  customerPagination: initialPagination,
  sellerPagination: initialPagination,
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersForPicker.pending, (state, action) => {
        state.fetchCustomersForPickerRequestId = action.meta.requestId;
        state.customerOptionsLoading = true;
        state.customerOptionsError = null;
      })
      .addCase(fetchCustomersForPicker.fulfilled, (state, action) => {
        if (state.fetchCustomersForPickerRequestId && state.fetchCustomersForPickerRequestId !== action.meta.requestId) return;
        state.customerOptionsLoading = false;
        state.customerOptions = sortByName(action.payload);
      })
      .addCase(fetchCustomersForPicker.rejected, (state, action) => {
        if (state.fetchCustomersForPickerRequestId && state.fetchCustomersForPickerRequestId !== action.meta.requestId) return;
        state.customerOptionsLoading = false;
        state.customerOptionsError = action.payload || action.error.message;
      })
      .addCase(fetchSellersForPicker.pending, (state, action) => {
        state.fetchSellersForPickerRequestId = action.meta.requestId;
        state.sellerOptionsLoading = true;
        state.sellerOptionsError = null;
      })
      .addCase(fetchSellersForPicker.fulfilled, (state, action) => {
        if (state.fetchSellersForPickerRequestId && state.fetchSellersForPickerRequestId !== action.meta.requestId) return;
        state.sellerOptionsLoading = false;
        state.sellerOptions = sortByName(action.payload);
      })
      .addCase(fetchSellersForPicker.rejected, (state, action) => {
        if (state.fetchSellersForPickerRequestId && state.fetchSellersForPickerRequestId !== action.meta.requestId) return;
        state.sellerOptionsLoading = false;
        state.sellerOptionsError = action.payload || action.error.message;
      })
      .addCase(fetchCustomers.pending, (state, action) => {
        state.fetchCustomersRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        if (state.fetchCustomersRequestId && state.fetchCustomersRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.customers = action.payload.customers || [];
        state.customerPagination =
          action.payload.pagination || initialPagination;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        if (state.fetchCustomersRequestId && state.fetchCustomersRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchSellers.pending, (state, action) => {
        state.fetchSellersRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellers.fulfilled, (state, action) => {
        if (state.fetchSellersRequestId && state.fetchSellersRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.sellers = action.payload.sellers || [];
        state.sellerPagination =
          action.payload.pagination || initialPagination;
      })
      .addCase(fetchSellers.rejected, (state, action) => {
        if (state.fetchSellersRequestId && state.fetchSellersRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default customerSlice.reducer;
