import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import api from '../axiosSetup';
import invoiceReducer from '../slices/invoiceSlice';
import { InvoiceStatus, VoidInvoiceButton } from './InvoiceStatus';

jest.mock('../axiosSetup', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('react-hot-toast', () => ({ success: jest.fn() }));
const invoice = { _id: 'invoice1', invoiceNo: 5, grandTotal: 500 };
const setup = (value = invoice) => {
  const store = configureStore({ reducer: { invoice: invoiceReducer } });
  const onVoided = jest.fn();
  render(<Provider store={store}><InvoiceStatus invoice={value} /><VoidInvoiceButton invoice={value} onVoided={onVoided} /></Provider>);
  return onVoided;
};
afterEach(() => jest.clearAllMocks());

test('shows legacy invoices as active and requires a reason before voiding', async () => {
  api.post.mockResolvedValue({ data: { invoice: { ...invoice, status: 'void' }, message: 'Invoice voided' } });
  const onVoided = setup();
  expect(screen.getByText('Active')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Void' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Confirm void' }).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Reason for voiding'), { target: { value: '  Duplicate order  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm void' }));
  await waitFor(() => expect(onVoided).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/api/invoice/invoice1/void'), { reason: 'Duplicate order' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('displays void history and offers no further void action', () => {
  setup({ ...invoice, status: 'void', voidReason: 'Cancelled order', voidedAt: '2026-11-05T00:00:00.000Z' });
  expect(screen.getByText('Void')).toBeTruthy();
  expect(screen.getByText('Cancelled order')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

test('keeps the reason available after a failed request and allows cancelling without a request', async () => {
  api.post.mockRejectedValue({ response: { data: { message: 'Invoice is already void' } } });
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Void' }));
  fireEvent.change(screen.getByLabelText('Reason for voiding'), { target: { value: 'Duplicate' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm void' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Invoice is already void'));
  expect(screen.getByLabelText('Reason for voiding').value).toBe('Duplicate');
  fireEvent.click(screen.getByRole('button', { name: 'Keep invoice' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(api.post).toHaveBeenCalledTimes(1);
});
