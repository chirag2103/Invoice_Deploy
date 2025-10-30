import { configureStore } from '@reduxjs/toolkit';
import invoiceSlice from './slices/invoiceSlice';
import paymentSlice from './slices/paymentSlice';
import purchaseInvoiceSlice from './slices/purchaseInvoiceSlice';
import purchasePaymentSlice from './slices/purchasePaymentSlice';
import analyticsSlice from './slices/analyticsSlice';
import customerSlice from './slices/customerSlice';
import challanSlice from './slices/challanSlice';
import quotationSlice from './slices/quotationSlice';
import poSlice from './slices/poSlice';
import userSlice from './slices/userSlice';
const store = configureStore({
  reducer: {
    invoice: invoiceSlice,
    customers: customerSlice,
    challan: challanSlice,
    quotation: quotationSlice,
    user: userSlice,
    analytics: analyticsSlice,
    payment: paymentSlice,
    purchaseInvoice: purchaseInvoiceSlice,
    purchasePayment: purchasePaymentSlice,
    po: poSlice,
  },
});

export default store;
