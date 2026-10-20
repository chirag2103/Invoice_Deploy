import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import api from '../axiosSetup';
import { rootReducer } from '../store';
import CustomerBills from '../pages/CustomerBills';
import PurchaseSummary from '../pages/PurchaseSummary';
import Customers from '../pages/Customers';
import { savedDocumentPdf } from './savedDocumentPdf';
import { getPdfExtras } from './pdfPayload';

jest.mock('../axiosSetup', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock('../components/AdminSidebar', () => () => <aside />);

const renderPage = (page) => render(<Provider store={configureStore({ reducer: rootReducer })}><MemoryRouter>{page}</MemoryRouter></Provider>);

afterEach(() => jest.restoreAllMocks());

test('customer report displays full backend totals and asks the server to filter settled accounts', async () => {
  api.get.mockResolvedValue({ data: {
    data: [{ customerId: 'c', customerName: 'Opening only', openingBalance: 100, totalBill: 0, totalPaid: 0, remainingAmount: 100 }],
    totals: { openingBalance: 300, totalBill: 500, totalPaid: 50, remainingAmount: 750 },
    pagination: { page: 1, limit: 10, totalItems: 11, totalPages: 2, hasNextPage: true },
  } });
  renderPage(<CustomerBills />);
  const total = await screen.findByRole('row', { name: /Total \(all matching accounts\)/ });
  expect(within(total).getByText('750.00')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Opening only' })).toHaveAttribute('href', '/statement/c');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show settled accounts' }));
  await waitFor(() => expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('/api/billingInfo'), expect.objectContaining({
    params: expect.objectContaining({ hideSettled: false, page: 1 }),
  })));
});

test('seller report displays all matching totals rather than summing its displayed page', async () => {
  api.get.mockResolvedValue({ data: {
    summary: [{ seller: { _id: 's', name: 'Supplier' }, openingBalance: 10, totalBills: 20, totalPaid: 0, remaining: 30 }],
    totals: { openingBalance: 100, totalBills: 200, totalPaid: 50, remaining: 250 },
    pagination: { page: 1, limit: 10, totalItems: 20, totalPages: 2 },
  } });
  renderPage(<PurchaseSummary />);
  const total = await screen.findByRole('row', { name: /Total \(all matching accounts\)/ });
  expect(within(total).getByText('250.00')).toBeInTheDocument();
});

test('archived customer can be restored from the management screen', async () => {
  api.get.mockResolvedValue({ data: { customers: [{ _id: 'c', name: 'Archived customer', isArchived: true }], pagination: { page: 1, limit: 10, totalPages: 1 } } });
  api.put.mockResolvedValue({ data: { success: true } });
  renderPage(<Customers />);
  fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith(expect.stringContaining('/api/customer/c/restore')));
});

test('snapshot fields take precedence over current branding; legacy invoices retain fallback branding', () => {
  const user = { companyDetails: { name: 'Changed company' }, signature: { dataUrl: 'new signature' } };
  const document = { invoiceNo: 1, invoiceProducts: [], issuedSnapshot: {
    customer: { name: 'Original customer' },
    company: { companyName: 'Original company', userSignature: null, template: 'minimal' },
  } };
  expect({ ...getPdfExtras(user), ...savedDocumentPdf(document, 'invoice') }).toMatchObject({
    customer: { name: 'Original customer' }, companyName: 'Original company', userSignature: null, template: 'minimal',
  });
  expect({ ...getPdfExtras(user), ...savedDocumentPdf({ invoiceNo: 1 }, 'invoice') }.companyName).toBe('Changed company');
});
