import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rootReducer } from '../store';
import { setCustomer, addProduct } from '../slices/invoiceSlice';
import api from '../axiosSetup';
import { generateInvoicePDF } from '../services/pdfGeneratorService';
import InvoiceForm from './InvoiceForm';

jest.mock('../axiosSetup', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock('../services/pdfGeneratorService', () => ({ generateInvoicePDF: jest.fn() }));

const customer = { _id: 'customer', name: 'Example Customer' };
const product = { name: 'Item', quantity: 1, rate: 100 };
const details = { disDocNo: 'DD-125', deliveryDate: '2026-11-14', dispatchedThrough: 'Example Transport', destination: 'Anand' };
const labels = { disDocNo: 'Dispatch Document No.', deliveryDate: 'Delivery Date', dispatchedThrough: 'Dispatched Through', destination: 'Destination' };

beforeEach(() => {
  api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/lastinvoice')
    ? { invoice: { invoiceNo: 1, financialYearLabel: '26-27' } }
    : { customers: [customer], pagination: { hasNextPage: false } } }));
});

const mount = (invoice) => {
  const store = configureStore({ reducer: rootReducer });
  if (!invoice) {
    store.dispatch(setCustomer(customer));
    store.dispatch(addProduct(product));
  }
  render(<Provider store={store}><MemoryRouter initialEntries={[{ pathname: '/invoices/new', state: invoice ? { invoice } : undefined }]}>
    <InvoiceForm />
  </MemoryRouter></Provider>);
};

test('new invoice inputs submit all delivery fields and pass saved values to PDF generation', async () => {
  api.post.mockImplementation((url, payload) => Promise.resolve({ data: { invoice: { ...payload, invoiceNo: 1, financialYearLabel: '26-27' } } }));
  mount();
  for (const [field, label] of Object.entries(labels)) fireEvent.change(screen.getByLabelText(label), { target: { value: details[field] } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate Invoice & Save' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/api/invoice/new'), expect.objectContaining(details), expect.any(Object)));
  await waitFor(() => expect(generateInvoicePDF).toHaveBeenCalledWith(expect.objectContaining(details)));
});

test('editing restores saved details and allows clearing the delivery date', async () => {
  const invoice = { _id: 'invoice', invoiceNo: 1, customer, gst: 9, gstType: 'intraState', date: '2026-11-01', invoiceProducts: [product], ...details, deliveryDate: '2026-11-14T00:00:00.000Z' };
  api.put.mockImplementation((url, payload) => Promise.resolve({ data: { invoice: { ...invoice, ...payload } } }));
  mount(invoice);
  for (const [field, label] of Object.entries(labels)) expect(screen.getByLabelText(label)).toHaveValue(details[field]);
  fireEvent.change(screen.getByLabelText('Delivery Date'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Vadodara' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save & Generate PDF' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith(expect.stringContaining('/api/invoice/invoice'), expect.objectContaining({ ...details, deliveryDate: '', destination: 'Vadodara' }), expect.any(Object)));
});
