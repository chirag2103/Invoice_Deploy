import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axiosSetup.js';
import { getTodayDate } from '../services/helper.js';

const apiUrl = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('token');

const initialState = {
  challanNo: 1,
  challanDate: getTodayDate(),
  customer: '',
  orderNo: '',
  orderDate: '',
  products: [], // { name, hsn, quantity, uom }
  loading: false,
  error: null,
  challans: [],
  message: '',
};

// -------------------- Async Thunks --------------------

export const fetchChallans = createAsyncThunk(
  'challan/fetchChallans',
  async () => {
    const response = await api.get(`${apiUrl}/api/challans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.challans;
  }
);

export const fetchChallanNo = createAsyncThunk(
  'challan/fetchChallanNo',
  async () => {
    const res = await api.get(`${apiUrl}/api/lastchallan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseInt(res.data.challan.challanNo);
  }
);

export const sendChallanData = createAsyncThunk(
  'challan/sendChallanData',
  async (challanData) => {
    const response = await api.post(`${apiUrl}/api/challan/new`, challanData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const deleteChallan = createAsyncThunk(
  'challan/deleteChallan',
  async (id) => {
    const response = await api.delete(`${apiUrl}/api/challan/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.message;
  }
);

// -------------------- Slice --------------------

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

    // ✅ ADD PRODUCT (HSN supported)
    addChallanProduct(state, action) {
      state.products.push({
        name: action.payload.name,
        hsn: action.payload.hsn || '',
        quantity: action.payload.quantity,
        uom: action.payload.uom || 'NOS',
      });
    },

    // ✅ EDIT PRODUCT FIELD (USED BY FORM)
    updateProductField(state, action) {
      const { index, field, value } = action.payload;
      if (state.products[index]) {
        state.products[index][field] = value;
      }
    },

    // ✅ REMOVE PRODUCT
    removeChallanProduct(state, action) {
      state.products.splice(action.payload, 1);
    },

    // ✅ RESET
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
      })
      .addCase(sendChallanData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendChallanData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteChallan.fulfilled, (state, action) => {
        state.message = action.payload;
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
