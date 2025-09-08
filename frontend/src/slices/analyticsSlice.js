import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

export const fetchFinancialYears = createAsyncThunk(
  'analytics/fetchFinancialYears',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/analytics/financial-years`
      );
      return data.years || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchFinancialYearAnalytics = createAsyncThunk(
  'analytics/fetchFinancialYearAnalytics',
  async (fy, { rejectWithValue }) => {
    try {
      const params = fy ? { fy } : {};
      const { data } = await axios.get(
        `${apiUrl}/api/analytics/financial-year`,
        { params }
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    years: [],
    loadingYears: false,
    fyData: null,
    loadingFy: false,
    error: null,
    selectedFy: null,
  },
  reducers: {
    setSelectedFy(state, action) {
      state.selectedFy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinancialYears.pending, (state) => {
        state.loadingYears = true;
        state.error = null;
      })
      .addCase(fetchFinancialYears.fulfilled, (state, action) => {
        state.loadingYears = false;
        state.years = action.payload;
        if (!state.selectedFy && action.payload.length) {
          state.selectedFy = action.payload[action.payload.length - 1]; // latest FY
        }
      })
      .addCase(fetchFinancialYears.rejected, (state, action) => {
        state.loadingYears = false;
        state.error = action.payload?.message || 'Failed to load years';
      })
      .addCase(fetchFinancialYearAnalytics.pending, (state) => {
        state.loadingFy = true;
        state.error = null;
      })
      .addCase(fetchFinancialYearAnalytics.fulfilled, (state, action) => {
        state.loadingFy = false;
        state.fyData = action.payload;
      })
      .addCase(fetchFinancialYearAnalytics.rejected, (state, action) => {
        state.loadingFy = false;
        state.error = action.payload?.message || 'Failed to load FY data';
      });
  },
});

export const { setSelectedFy } = analyticsSlice.actions;
export default analyticsSlice.reducer;
