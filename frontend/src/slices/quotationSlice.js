import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchQuotations = createAsyncThunk(
  'quotations/fetchQuotations',
  async () => {
    const response = await axios.get('/api/quotations');
    return response.data.quotations;
  }
);

export const createQuotation = createAsyncThunk(
  'quotations/createQuotation',
  async (quotationData) => {
    const response = await axios.post('/api/quotation/new', quotationData);
    return response.data.quotation;
  }
);

export const updateQuotation = createAsyncThunk(
  'quotations/updateQuotation',
  async ({ id, quotationData }) => {
    const response = await axios.put(`/api/quotation/${id}`, quotationData);
    return response.data.quotation;
  }
);

export const deleteQuotation = createAsyncThunk(
  'quotations/deleteQuotation',
  async (id) => {
    await axios.delete(`/api/quotation/${id}`);
    return id;
  }
);

export const convertToInvoice = createAsyncThunk(
  'quotations/convertToInvoice',
  async (id) => {
    const response = await axios.post(
      `/api/quotation/${id}/convert-to-invoice`
    );
    return response.data;
  }
);

const quotationSlice = createSlice({
  name: 'quotations',
  initialState: {
    quotations: [],
    loading: false,
    error: null,
    currentQuotation: null,
  },
  reducers: {
    setCurrentQuotation: (state, action) => {
      state.currentQuotation = action.payload;
    },
    clearCurrentQuotation: (state) => {
      state.currentQuotation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch quotations
      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create quotation
      .addCase(createQuotation.fulfilled, (state, action) => {
        state.quotations.push(action.payload);
      })
      // Update quotation
      .addCase(updateQuotation.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(
          (quotation) => quotation._id === action.payload._id
        );
        if (index !== -1) {
          state.quotations[index] = action.payload;
        }
      })
      // Delete quotation
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.quotations = state.quotations.filter(
          (quotation) => quotation._id !== action.payload
        );
      })
      // Convert to invoice
      .addCase(convertToInvoice.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(
          (quotation) => quotation._id === action.payload.quotation._id
        );
        if (index !== -1) {
          state.quotations[index] = action.payload.quotation;
        }
      });
  },
});

export const { setCurrentQuotation, clearCurrentQuotation } =
  quotationSlice.actions;
export default quotationSlice.reducer;
