import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import api from '../axiosSetup';
import { rootReducer } from '../store';
import { loginSuccess, logout } from '../slices/userSlice';
import customerReducer, { fetchCustomers, fetchCustomersForPicker, fetchSellersForPicker } from '../slices/customerSlice';
import { fetchInvoices } from '../slices/invoiceSlice';
import analyticsReducer, { fetchFinancialYearAnalytics, setSelectedFy } from '../slices/analyticsSlice';
import { fetchAllPages } from './fetchAllPages';
import { recalculateDocument } from './documentTotals';
import { savedDocumentPdf } from './savedDocumentPdf';
import CustomerInvoices from '../pages/CustomerInvoices';
import Dashboard from '../pages/Dashboard';
import InvoiceList from '../components/InvoiceList';

jest.mock('../axiosSetup', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../components/AdminSidebar', () => () => <aside />);

afterEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

test('complete lists follow server pagination even when it caps the requested limit', async () => {
  api.get.mockResolvedValueOnce({ data: { customers: [{ name: 'B' }], pagination: { hasNextPage: true } } })
    .mockResolvedValueOnce({ data: { customers: [{ name: 'C' }], pagination: { hasNextPage: false } } });
  expect(await fetchAllPages('/api/customers', 'customers')).toHaveLength(2);
  expect(api.get.mock.calls[1][1].params.page).toBe(2);
});

test('complete A-Z picker collections stay separate from management pages', async () => {
  api.get.mockImplementation((url) => Promise.resolve({ data: {
    [url.endsWith('sellers') ? 'sellers' : 'customers']: [{ name: 'Zebra' }, { name: ' alpha ' }],
    pagination: { hasNextPage: false },
  } }));
  const store = configureStore({ reducer: { customers: customerReducer } });
  await store.dispatch(fetchCustomersForPicker());
  await store.dispatch(fetchSellersForPicker());
  store.dispatch(fetchCustomers.fulfilled({ customers: [{ name: 'Management page' }] }, 'page'));
  const state = store.getState().customers;
  expect(state.customerOptions.map((c) => c.name.trim())).toEqual(['alpha', 'Zebra']);
  expect(state.sellerOptions).toHaveLength(2);
  expect(state.customers[0].name).toBe('Management page');
});

test('preview rounds line amounts, split tax, and grand total like the backend', () => {
  const state = { products: [{ quantity: 1, rate: 100.42 }], gst: 9, gstType: 'intraState' };
  recalculateDocument(state);
  expect(state.grandTotal).toBe(119);
  expect(state.taxBreakup).toEqual({ taxable: 100.42, cgst: 9.04, sgst: 9.04, igst: 0, roundOff: 0.5 });
  state.products = [{ quantity: 3, rate: 0.335, discount: 10 }];
  state.gstType = 'interState';
  recalculateDocument(state);
  expect(state.totalAmount).toBe(0.91);
  expect(state.taxBreakup.igst).toBe(0.16);
  expect(state.taxBreakup.cgst).toBe(0);
});

test('saved PDF mapping keeps authoritative discount, IGST, totals, and products', () => {
  const document = { invoiceNo: 5, financialYearLabel: '26-27', invoiceProducts: [{ name: 'Item' }],
    invoiceDiscount: 20, invoiceTotal: 100, grandTotal: 94, gstType: 'interState', taxBreakup: { igst: 14.4 } };
  expect(savedDocumentPdf(document, 'invoice')).toMatchObject({
    products: document.invoiceProducts, invoiceDiscount: 20, totalAmount: 100,
    grandTotal: 94, gstType: 'interState', taxBreakup: document.taxBreakup,
  });
});

test('logout and account changes reset all data and ignore old request completions', () => {
  const store = configureStore({ reducer: rootReducer });
  store.dispatch(loginSuccess({ user: { _id: 'a' }, token: 'a' }));
  store.dispatch(fetchInvoices.pending('old', {}));
  store.dispatch({ type: 'invoice/addProduct', payload: { name: 'Private', quantity: 1, rate: 100 } });
  store.dispatch(logout());
  expect(store.getState().invoice.products).toEqual([]);
  expect(store.getState().user.user).toBeNull();
  store.dispatch(loginSuccess({ user: { _id: 'b' }, token: 'b' }));
  store.dispatch(fetchInvoices.fulfilled({ invoices: [{ _id: 'private' }] }, 'old', {}));
  expect(store.getState().invoice.invoices).toEqual([]);
});

test('analytics ignores a previous financial year response arriving late', () => {
  let state = analyticsReducer(undefined, setSelectedFy('25-26'));
  state = analyticsReducer(state, fetchFinancialYearAnalytics.pending('old', '25-26'));
  state = analyticsReducer(state, setSelectedFy('26-27'));
  state = analyticsReducer(state, fetchFinancialYearAnalytics.pending('new', '26-27'));
  state = analyticsReducer(state, fetchFinancialYearAnalytics.fulfilled({ financialYearLabel: '25-26' }, 'old', '25-26'));
  expect(state.fyData).toBeNull();
  expect(state.loadingFy).toBe(true);
});

test('customer payments have independent page navigation', async () => {
  api.get.mockImplementation((url, config) => Promise.resolve({ data: url.endsWith('payments') ? {
    payments: [{ _id: 'p', date: '2026-05-01', amountPaid: 10 }], paidAmount: 30,
    pagination: { page: config.params.page, limit: 10, totalPages: 3, totalItems: 30, hasNextPage: true, hasPrevPage: false },
  } : { invoices: [], customerName: 'Example', total: 50,
    pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 0 } } }));
  const store = configureStore({ reducer: rootReducer });
  render(<Provider store={store}><MemoryRouter initialEntries={['/customer/c/invoices']}><Routes>
    <Route path='/customer/:customerId/invoices' element={<CustomerInvoices />} />
  </Routes></MemoryRouter></Provider>);
  await screen.findByText('Paid Amount: 30.00');
  fireEvent.click(screen.getAllByRole('button', { name: 'Next' })[1]);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/customer/c/payments', expect.objectContaining({
    params: expect.objectContaining({ page: 2 }),
  })));
});

test('dashboard shows analytics failures and offers retry', async () => {
  api.get.mockRejectedValue({ response: { data: { message: 'Analytics unavailable' } } });
  const store = configureStore({ reducer: rootReducer });
  render(<Provider store={store}><MemoryRouter><Dashboard /></MemoryRouter></Provider>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Analytics unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
});

test('invoice sort control requests backend sorting', async () => {
  api.get.mockResolvedValue({ data: { invoices: [], availableFinancialYears: [],
    pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 0 } } });
  const store = configureStore({ reducer: rootReducer });
  render(<Provider store={store}><MemoryRouter><InvoiceList /></MemoryRouter></Provider>);
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), { target: { value: 'amount' } });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/api/invoices'), {
    params: expect.objectContaining({ sort: 'amount', page: 1 }),
  }));
});
