import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';

const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${apiUrl}/api/customers`, {
        params,
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch sellers'
      );
    }
  }
);

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
  customers: [],
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
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers || [];
        state.customerPagination =
          action.payload.pagination || initialPagination;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchSellers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload.sellers || [];
        state.sellerPagination =
          action.payload.pagination || initialPagination;
      })
      .addCase(fetchSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default customerSlice.reducer;
