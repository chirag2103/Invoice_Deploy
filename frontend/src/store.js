import { configureStore } from '@reduxjs/toolkit';
import invoiceSlice from './slices/invoiceSlice';
import customerSlice from './slices/customerSlice';
import challanSlice from './slices/challanSlice';
import quotationSlice from './slices/quotationSlice';
import userSlice from './slices/userSlice';
const store = configureStore({
  reducer: {
    invoice: invoiceSlice,
    customers: customerSlice,
    challan: challanSlice,
    quotation: quotationSlice,
    user: userSlice,
  },
});

export default store;
