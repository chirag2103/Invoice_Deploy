import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('token');

const initialState = {
  challanNo: 1,
  challanDate: '',
  customer: '',
  orderNo: '',
  orderDate: '',
  products: [],
  totalAmount: 0,
  gst: 0,
  grandTotal: 0,
  loading: false,
  error: null,
  challans: [],
  message: '',
};

export const fetchChallans = createAsyncThunk(
  'challan/fetchChallans',
  async () => {
    const response = await axios.get(`${apiUrl}/api/challans`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.challans;
  }
);

export const fetchChallanNo = createAsyncThunk(
  'challan/fetchChallanNo',
  async () => {
    const res = await axios.get(`${apiUrl}/api/lastinvoice`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(res);
    return parseInt(res.data.invoice.invoiceNo);
  }
);

export const sendChallanData = createAsyncThunk(
  'challan/sendChallanData',
  async (challanData) => {
    const response = await axios.post(
      `${apiUrl}/api/challan/new`,
      challanData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }
);

export const deleteChallan = createAsyncThunk(
  'challan/deleteChallan',
  async (id) => {
    const response = await axios.delete(`${apiUrl}/api/challan/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.message;
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
      state.products.push(action.payload);
    },
    removeChallanProduct(state, action) {
      state.products.splice(action.payload, 1);
    },
    updateProductField(state, action) {
      const { index, field, value } = action.payload;
      if (state.products[index]) {
        state.products[index][field] = value;
      }
    },
    calculateTotal(state) {
      state.totalAmount = state.products.reduce(
        (acc, p) => acc + p.quantity * p.rate,
        0
      );
      state.grandTotal = Math.round(
        state.totalAmount + (state.totalAmount * state.gst * 2) / 100
      );
    },
    setGst(state, action) {
      state.gst = action.payload;
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
        state.challans = action.payload;
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(sendChallanData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChallanData.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(sendChallanData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteChallan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChallan.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(deleteChallan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchChallanNo.fulfilled, (state, action) => {
        // console.log(action);

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
  removeChallanProduct,
  updateProductField,
  calculateTotal,
  setGst,
  clearChallanData,
} = challanSlice.actions;

export default challanSlice.reducer;
