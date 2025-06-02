import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchChallans = createAsyncThunk(
  'challans/fetchChallans',
  async () => {
    const response = await axios.get('/api/challans');
    return response.data.challans;
  }
);

export const createChallan = createAsyncThunk(
  'challans/createChallan',
  async (challanData) => {
    const response = await axios.post('/api/challan/new', challanData);
    return response.data.challan;
  }
);

export const updateChallan = createAsyncThunk(
  'challans/updateChallan',
  async ({ id, challanData }) => {
    const response = await axios.put(`/api/challan/${id}`, challanData);
    return response.data.challan;
  }
);

export const deleteChallan = createAsyncThunk(
  'challans/deleteChallan',
  async (id) => {
    await axios.delete(`/api/challan/${id}`);
    return id;
  }
);

export const updateChallanStatus = createAsyncThunk(
  'challans/updateStatus',
  async ({ id, status }) => {
    const response = await axios.patch(`/api/challan/${id}/status`, { status });
    return response.data.challan;
  }
);

const challanSlice = createSlice({
  name: 'challans',
  initialState: {
    challans: [],
    loading: false,
    error: null,
    currentChallan: null,
  },
  reducers: {
    setCurrentChallan: (state, action) => {
      state.currentChallan = action.payload;
    },
    clearCurrentChallan: (state) => {
      state.currentChallan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch challans
      .addCase(fetchChallans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChallans.fulfilled, (state, action) => {
        state.loading = false;
        state.challans = action.payload;
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create challan
      .addCase(createChallan.fulfilled, (state, action) => {
        state.challans.push(action.payload);
      })
      // Update challan
      .addCase(updateChallan.fulfilled, (state, action) => {
        const index = state.challans.findIndex(
          (challan) => challan._id === action.payload._id
        );
        if (index !== -1) {
          state.challans[index] = action.payload;
        }
      })
      // Delete challan
      .addCase(deleteChallan.fulfilled, (state, action) => {
        state.challans = state.challans.filter(
          (challan) => challan._id !== action.payload
        );
      })
      // Update status
      .addCase(updateChallanStatus.fulfilled, (state, action) => {
        const index = state.challans.findIndex(
          (challan) => challan._id === action.payload._id
        );
        if (index !== -1) {
          state.challans[index] = action.payload;
        }
      });
  },
});

export const { setCurrentChallan, clearCurrentChallan } = challanSlice.actions;
export default challanSlice.reducer;
