import { advanceSession } from './services/session';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import invoiceSlice from './slices/invoiceSlice';
import paymentSlice from './slices/paymentSlice';
import purchaseInvoiceSlice from './slices/purchaseInvoiceSlice';
import purchasePaymentSlice from './slices/purchasePaymentSlice';
import analyticsSlice from './slices/analyticsSlice';
import customerSlice from './slices/customerSlice';
import challanSlice from './slices/challanSlice';
import quotationSlice from './slices/quotationSlice';
import poSlice from './slices/poSlice';
import proformaSlice from './slices/proformaSlice';
import userSlice from './slices/userSlice';
const combinedReducer = combineReducers({
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
    proforma: proformaSlice,
});

const pending = new Set();
const obsolete = new Set();
export const rootReducer = (state, action) => {
  const accountChanged = action.type === 'user/loginSuccess' && (
    state?.user?.user?._id !== action.payload.user?._id ||
    state?.user?.token !== action.payload.token
  );
  if (action.type === 'user/logout' || accountChanged) {
    advanceSession();
    pending.forEach((id) => obsolete.add(id));
    pending.clear();
    return combinedReducer({ user: userSlice(state?.user, action) }, { type: '@@session/reset' });
  }
  // Requests started before logout must not restore the previous account's data.
  const id = action.meta?.requestId;
  if (id && action.meta.requestStatus === 'pending') pending.add(id);
  if (id && ['fulfilled', 'rejected'].includes(action.meta.requestStatus)) {
    pending.delete(id);
    if (obsolete.delete(id)) return state;
  }
  return combinedReducer(state, action);
};
const store = configureStore({ reducer: rootReducer });
export default store;
