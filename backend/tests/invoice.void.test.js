import Invoice from '../models/Invoice.js';
import { authAgent, makeUser, makeCustomer, sampleProduct } from './helpers/index.js';

const payload = (customer, rate = 100) => ({ customer, date: '2026-05-01', gst: 0, invoiceProducts: [sampleProduct({ rate })] });

describe('invoice void workflow', () => {
  it('preserves history and numbering, excludes void amounts everywhere, and retains payments', async () => {
    const { token, user } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token, { openingBalance: 20 });
    const first = (await api.post('/api/invoice/new').send(payload(customer._id, 500))).body.invoice;
    const active = (await api.post('/api/invoice/new').send(payload(customer._id))).body.invoice;
    // Old documents with no status must remain active without a migration.
    await Invoice.collection.updateOne({ _id: (await Invoice.findById(active._id))._id }, { $unset: { status: '' } });
    await api.post('/api/payment/new').send({ customer: customer._id, date: '2026-05-02', amountPaid: 150 });
    const result = await api.post(`/api/invoice/${first._id}/void`).send({ reason: '  Issued in error  ' });
    expect(result.status).toBe(200);
    expect(result.body.invoice).toMatchObject({ status: 'void', voidReason: 'Issued in error', voidedBy: user._id, grandTotal: 500, invoiceNo: first.invoiceNo, issuedSnapshot: first.issuedSnapshot });
    expect(result.body.invoice.voidedAt).toBeTruthy();
    const all = await api.get('/api/invoices');
    expect(all.body.pagination.totalItems).toBe(2);
    expect(all.body.invoices.find((invoice) => invoice._id === first._id).status).toBe('void');
    const byCustomer = await api.get(`/api/customer/${customer._id}/invoices?limit=1`);
    expect(byCustomer.body.total).toBe(100);
    expect(byCustomer.body.pagination.totalItems).toBe(2);
    const billing = await api.get('/api/billingInfo?hideSettled=false');
    expect(billing.body.data[0]).toMatchObject({ totalBill: 100, totalPaid: 150, remainingAmount: -30 });
    const statement = await api.get(`/api/statement/${customer._id}`);
    expect(statement.body).toMatchObject({ totalInvoice: 100, totalPaid: 150, remainingAmount: -30 });
    expect(statement.body.statement.filter((entry) => entry.type === 'invoice')).toHaveLength(1);
    const summary = await api.get('/api/analytics/summary?fy=26-27');
    expect(summary.body.totals).toMatchObject({ revenue: 100, receipts: 150, invoiceCount: 1 });
    expect(summary.body.monthly.find((month) => month.monthKey === '2026-05')).toMatchObject({ totalInvoices: 100, invoiceCount: 1 });
    expect(summary.body.recentInvoices.map((invoice) => invoice._id)).toEqual([active._id]);
    const next = await api.post('/api/invoice/new').send(payload(customer._id));
    expect(next.body.invoice.invoiceNo).toBe(active.invoiceNo + 1);
    expect((await api.get(`/api/invoice/${first._id}`)).body.invoice.status).toBe('void');
  });

  it('validates reasons, isolates accounts, prevents edits and preserves the first cancellation audit', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);
    const invoice = (await api.post('/api/invoice/new').send(payload(customer._id))).body.invoice;
    const url = `/api/invoice/${invoice._id}`;
    for (const reason of ['', '  ', 'x'.repeat(501), { injected: true }]) {
      expect((await api.post(`${url}/void`).send({ reason })).status).toBe(400);
    }
    expect((await api.delete(url)).status).toBe(400);
    expect(await Invoice.findById(invoice._id)).toBeTruthy();
    const outsider = authAgent((await makeUser()).token);
    expect((await outsider.post(`${url}/void`).send({ reason: 'Other account' })).status).toBe(404);
    // The legacy delete endpoint safely voids instead of deleting.
    const cancelled = await api.delete(url).send({ reason: 'Duplicate invoice' });
    expect(cancelled.status).toBe(200);
    expect((await api.put(url).send({ destination: 'Changed', status: 'active' })).status).toBe(409);
    expect((await api.post(`${url}/void`).send({ reason: 'Changed reason' })).status).toBe(409);
    const saved = (await api.get(url)).body.invoice;
    expect(saved).toMatchObject({ status: 'void', voidReason: 'Duplicate invoice', voidedAt: cancelled.body.invoice.voidedAt });
    expect(saved.destination).toBeUndefined();
  });

  it('rejects saving an edit loaded before cancellation', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);
    const invoice = (await api.post('/api/invoice/new').send(payload(customer._id))).body.invoice;
    const staleEdit = await Invoice.findById(invoice._id);
    await api.post(`/api/invoice/${invoice._id}/void`).send({ reason: 'Cancelled' });
    staleEdit.destination = 'Concurrent edit';
    await expect(staleEdit.save()).rejects.toMatchObject({ name: 'VersionError' });
    expect((await Invoice.findById(invoice._id)).status).toBe('void');
  });
});
