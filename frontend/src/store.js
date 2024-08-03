import { configureStore } from '@reduxjs/toolkit';
import invoiceSlice from './slices/invoiceSlice';
import customerSlice from './slices/customerSlice';
const store = configureStore({
  reducer: {
    invoice: invoiceSlice,
    customers: customerSlice,
  },
});

export default store;
