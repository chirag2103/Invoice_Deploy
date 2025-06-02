import { configureStore } from '@reduxjs/toolkit';
import invoiceReducer from './slices/invoiceSlice';
import customerReducer from './slices/customerSlice';
import quotationReducer from './slices/quotationSlice';
import challanReducer from './slices/challanSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    invoice: invoiceReducer,
    customer: customerReducer,
    quotation: quotationReducer,
    challan: challanReducer,
    auth: authReducer,
  },
});

export default store;
