import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';
import { getTodayDate } from '../services/helper.js';

const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

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
  challanNo: 1,
  challanDate: getTodayDate(),
  customer: '',
  orderNo: '',
  orderDate: '',
  products: [],
  loading: false,
  error: null,
  challans: [],
  pagination: initialPagination,
  message: '',
};

export const fetchChallans = createAsyncThunk(
  'challan/fetchChallans',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${apiUrl}/api/challans`, {
        params,
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch challans'
      );
    }
  }
);

export const fetchChallanNo = createAsyncThunk(
  'challan/fetchChallanNo',
  async () => {
    const res = await api.get(`${apiUrl}/api/lastchallan`, {
      headers: getAuthHeaders(),
    });
    return parseInt(res.data.challan.challanNo);
  }
);

export const sendChallanData = createAsyncThunk(
  'challan/sendChallanData',
  async (challanData) => {
    const response = await api.post(`${apiUrl}/api/challan/new`, challanData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
);

export const deleteChallan = createAsyncThunk(
  'challan/deleteChallan',
  async (id) => {
    const response = await api.delete(`${apiUrl}/api/challan/${id}`, {
      headers: getAuthHeaders(),
    });
    return { id, message: response.data.message };
  }
);

const challanSlice = createSlice({
  name: 'challan',
  initialState,
  reducers: {
    setChallanCustomer(state, action) {
      state.customer = action.payload;
    },
    setChallanNo(state, action) {
      state.challanNo = action.payload;
    },
    setChallanDate(state, action) {
      state.challanDate = action.payload;
    },
    setOrderNo(state, action) {
      state.orderNo = action.payload;
    },
    setOrderDate(state, action) {
      state.orderDate = action.payload;
    },
    addChallanProduct(state, action) {
      state.products.push({
        name: action.payload.name,
        hsn: action.payload.hsn || '',
        quantity: action.payload.quantity,
        uom: action.payload.uom || 'NOS',
      });
    },
    updateProductField(state, action) {
      const { index, updatedFields, field, value } = action.payload;
      if (!state.products[index]) return;

      if (updatedFields) {
        state.products[index] = {
          ...state.products[index],
          ...updatedFields,
        };
      } else if (field !== undefined) {
        state.products[index][field] = value;
      }
    },
    removeChallanProduct(state, action) {
      state.products.splice(action.payload, 1);
    },
    clearChallanData() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchChallans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChallans.fulfilled, (state, action) => {
        state.loading = false;
        state.challans = action.payload.challans || [];
        state.pagination = action.payload.pagination || initialPagination;
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(sendChallanData.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendChallanData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendChallanData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteChallan.fulfilled, (state, action) => {
        state.challans = state.challans.filter(
          (challan) => challan._id !== action.payload.id
        );
        state.message = action.payload.message;
      })
      .addCase(fetchChallanNo.fulfilled, (state, action) => {
        state.challanNo = action.payload + 1;
      });
  },
});

export const {
  setChallanCustomer,
  setChallanNo,
  setChallanDate,
  setOrderNo,
  setOrderDate,
  addChallanProduct,
  updateProductField,
  removeChallanProduct,
  clearChallanData,
} = challanSlice.actions;

export default challanSlice.reducer;
