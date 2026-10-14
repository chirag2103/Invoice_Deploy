import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';
import { getTodayDate } from '../services/helper.js';
import { initialPagination } from '../constants/pagination.js';

const apiUrl = process.env.REACT_APP_API_URL;

const initialState = {
  challanNo: 1,
  financialYearLabel: '',
  currentFinancialYear: '',
  availableFinancialYears: [],
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
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get(`${apiUrl}/api/lastchallan`, {
        params: date ? { date } : {},
      });
      return res.data.challan;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch next challan number'
      );
    }
  }
);

export const sendChallanData = createAsyncThunk(
  'challan/sendChallanData',
  async (challanData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `${apiUrl}/api/challan/new`,
        challanData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save challan'
      );
    }
  }
);

export const deleteChallan = createAsyncThunk(
  'challan/deleteChallan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${apiUrl}/api/challan/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete challan'
      );
    }
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
        state.availableFinancialYears = action.payload.availableFinancialYears || [];
        state.currentFinancialYear = action.payload.currentFinancialYear || '';
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
      .addCase(deleteChallan.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchChallanNo.fulfilled, (state, action) => {
        state.challanNo = action.payload.challanNo;
        state.financialYearLabel = action.payload.financialYearLabel || '';
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
