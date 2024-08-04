import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  billNo: 1,
  customer: '',
  date: '',
  products: [],
  totalAmount: 0,
  grandTotal: 0,
  gst: 6,
  error: null,
  loading: false,
  invoices: [],
  message: '',
};

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async (id = null) => {
    try {
      if (id == null) {
        const response = await axios.get(
          'https://invoice-deploy.onrender.com/api/invoices'
        );
        console.log(response.data.invoices);
        return response.data.invoices;
      } else {
        const response = await axios.get(
          `https://invoice-deploy.onrender.com/api/customer/${id}/invoices`
        );
        return response.data.invoices;
      }
    } catch (error) {
      throw error;
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoice/deleteInvoice',
  async (id) => {
    try {
      const response = await axios.delete(
        'https://invoice-deploy.onrender.com/api/invoices'
      );
      console.log(response.data.invoices);
      return response.data.message;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchBillNo = createAsyncThunk('invoice/fetchBillNo', async () => {
  try {
    const response = await axios.get(
      'https://invoice-deploy.onrender.com/api/lastinvoice'
    );
    return parseInt(response.data.invoice.invoiceNo);
  } catch (error) {
    throw error;
  }
});

export const sendInvoiceData = createAsyncThunk(
  'invoice/sendInvoiceData',
  async (invoiceData) => {
    try {
      const response = await axios.post('/api/invoices', invoiceData);
      return response.data;
    } catch (error) {
      throw error;
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
    },
    addProduct(state, action) {
      state.products.push(action.payload);
      state.totalAmount += action.payload.quantity * action.payload.rate;
      console.log(state.gst + 'gst');
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },
    removeProduct(state, action) {
      const removedProduct = state.products.splice(action.payload, 1)[0];
      state.totalAmount -= removedProduct.quantity * removedProduct.rate;
      state.grandTotal =
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100;
    },
    storeInvoice(state, action) {},
    clearAllData(state) {
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
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchBillNo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillNo.fulfilled, (state, action) => {
        state.loading = false;
        // console.log('last bill' + action.payload);
        state.billNo = action.payload + 1;
      })
      .addCase(fetchBillNo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.loading = false;
        // console.log('last bill' + action.payload);
        state.message = action.payload;
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(sendInvoiceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendInvoiceData.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(sendInvoiceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setCustomer, setGst, addProduct, removeProduct, clearAllData } =
  invoiceSlice.actions;
export default invoiceSlice.reducer;
