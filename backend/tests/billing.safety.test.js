import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Seller from '../models/Seller.js';
import PurchaseInvoice from '../models/PurchaseInvoice.js';
import { authAgent, makeUser, makeCustomer, makeSeller, sampleProduct } from './helpers/index.js';

const invoicePayload = (customer) => ({ customer, date: '2026-05-01', gst: 0, invoiceProducts: [sampleProduct()] });

describe('billing summaries, party archives, and historical invoices', () => {
  it('filters before pagination, includes opening-only customers and totals every matching page', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    await makeCustomer(token, { name: 'Alpha', openingBalance: 100 });
    const beta = await makeCustomer(token, { name: 'Beta', openingBalance: 200 });
    const settled = await makeCustomer(token, { name: 'A settled' });
    await api.post('/api/invoice/new').send({ ...invoicePayload(beta._id), invoiceProducts: [sampleProduct({ rate: 500 })] });
    await api.post('/api/payment/new').send({ customer: beta._id, amountPaid: 50, date: '2026-05-02' });
    await api.post('/api/invoice/new').send(invoicePayload(settled._id));
    await api.post('/api/payment/new').send({ customer: settled._id, amountPaid: 100, date: '2026-05-02' });
    const first = await api.get('/api/billingInfo?hideSettled=true&limit=1');
    expect(first.status).toBe(200);
    expect(first.body.data[0].customerName).toBe('Alpha');
    expect(first.body.pagination.totalItems).toBe(2);
    expect(first.body.totals).toEqual({ openingBalance: 300, totalBill: 500, totalPaid: 50, remainingAmount: 750 });
    const second = await api.get('/api/billingInfo?hideSettled=true&limit=1&page=2');
    expect(second.body.data[0].customerName).toBe('Beta');
    expect(second.body.totals).toEqual(first.body.totals);
    const searched = await api.get('/api/billingInfo?search=Alpha&hideSettled=true');
    expect(searched.body.totals.remainingAmount).toBe(100);
    const all = await api.get('/api/billingInfo?hideSettled=false');
    expect(all.body.pagination.totalItems).toBe(3);
  });

  it('returns full seller totals and keeps archived opening balances in financial reports', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const alpha = await makeSeller(token, { name: 'Alpha', openingBalance: 40 });
    const beta = await makeSeller(token, { name: 'Beta', openingBalance: 60 });
    await api.post('/api/purchase/new').send({ seller: beta._id, invoiceNo: 'B1', date: '2026-05-01', amount: 100 });
    await api.post('/api/purchase/payment/new').send({ seller: beta._id, date: '2026-05-01', amountPaid: 25 });
    await api.delete(`/api/seller/${alpha._id}`);
    const result = await api.get('/api/purchase/summary/all?hideSettled=true&limit=1');
    expect(result.status).toBe(200);
    expect(result.body.pagination.totalItems).toBe(2);
    expect(result.body.totals).toEqual({ openingBalance: 100, totalBills: 100, totalPaid: 25, remaining: 175 });
    const searched = await api.get('/api/purchase/summary/all?search=Alpha');
    expect(searched.body.totals.remaining).toBe(40);
  });

  it('archives customers without losing invoice references, blocks new assignments, and supports restore', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);
    await api.post('/api/invoice/new').send(invoicePayload(customer._id));
    expect((await api.delete(`/api/customer/${customer._id}`)).body.archived).toBe(true);
    expect(await Customer.findById(customer._id)).not.toBeNull();
    expect((await api.get('/api/customers')).body.customers).toHaveLength(0);
    expect((await api.get('/api/customers?includeArchived=true')).body.customers).toHaveLength(1);
    const stored = await api.get('/api/invoices');
    expect(stored.body.invoices[0].customer.name).toBe(customer.name);
    for (const [url, body] of [
      ['/api/invoice/new', invoicePayload(customer._id)],
      ['/api/quotation/new', { customer: customer._id, date: '2026-05-01', quotationProducts: [sampleProduct()] }],
      ['/api/proforma/new', { customer: customer._id, date: '2026-05-01', proformaProducts: [sampleProduct()] }],
      ['/api/challan/new', { customer: customer._id, challanDate: '2026-05-01', challanProducts: [sampleProduct()] }],
      ['/api/payment/new', { customer: customer._id, date: '2026-05-01', amountPaid: 10 }],
    ]) expect((await api.post(url).send(body)).status).toBe(404);
    expect((await api.put(`/api/customer/${customer._id}/restore`)).status).toBe(200);
    expect((await api.post('/api/invoice/new').send(invoicePayload(customer._id))).status).toBe(201);
  });

  it('archives sellers without breaking references and prevents cross-account restore/archive', async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const api = authAgent(owner.token);
    const seller = await makeSeller(owner.token);
    const created = await api.post('/api/purchase/new').send({ seller: seller._id, invoiceNo: 'S1', date: '2026-05-01', amount: 100 });
    expect(created.status).toBe(201);
    expect((await authAgent(other.token).delete(`/api/seller/${seller._id}`)).status).toBe(404);
    expect((await api.delete(`/api/seller/${seller._id}`)).body.archived).toBe(true);
    expect(await Seller.findById(seller._id)).not.toBeNull();
    expect((await PurchaseInvoice.findById(created.body.purchase._id).populate('seller')).seller.name).toBe(seller.name);
    for (const [url, body] of [
      ['/api/purchase/new', { seller: seller._id, invoiceNo: 'S2', date: '2026-05-01', amount: 100 }],
      ['/api/po/new', { seller: seller._id, date: '2026-05-01', poProducts: [sampleProduct()] }],
      ['/api/purchase/payment/new', { seller: seller._id, date: '2026-05-01', amountPaid: 10 }],
    ]) expect((await api.post(url).send(body)).status).toBe(404);
    expect((await authAgent(other.token).put(`/api/seller/${seller._id}/restore`)).status).toBe(404);
    expect((await api.put(`/api/seller/${seller._id}/restore`)).status).toBe(200);
  });

  it('captures trusted invoice print details and preserves them after profile/party edits', async () => {
    const { token, email } = await makeUser();
    const api = authAgent(token);
    await api.put('/api/user/me/update').send({ name: 'Owner', email, companyDetails: { name: 'Original Company' }, bankDetails: { accountNumber: '123' }, pdfTemplate: 'minimal' });
    const customer = await makeCustomer(token, { name: 'Original Customer' });
    const created = await api.post('/api/invoice/new').send({ ...invoicePayload(customer._id), issuedSnapshot: { company: { companyName: 'Forged' } } });
    const invoice = created.body.invoice;
    expect(invoice.issuedSnapshot.company.companyName).toBe('Original Company');
    expect(invoice.issuedSnapshot.company.template).toBe('minimal');
    expect(invoice.issuedSnapshot.customer.name).toBe('Original Customer');
    await api.put('/api/user/me/update').send({ name: 'Owner', email, companyDetails: { name: 'Changed Company' }, bankDetails: { accountNumber: '999' } });
    await api.put(`/api/customer/${customer._id}`).send({ name: 'Changed Customer', gstNo: customer.gstNo, address: 'Changed Address' });
    await api.put(`/api/invoice/${invoice._id}`).send({ ...invoicePayload(customer._id), issuedSnapshot: { company: { companyName: 'Forged again' } } });
    const saved = await api.get('/api/invoices');
    expect(saved.body.invoices[0].issuedSnapshot).toEqual(invoice.issuedSnapshot);
    expect(saved.body.invoices[0].customer.name).toBe('Changed Customer');
  });

  it('keeps legacy invoices readable without inventing historical snapshot values', async () => {
    const { token, user } = await makeUser();
    const customer = await makeCustomer(token);
    const old = await Invoice.create({ user: user._id, customer: customer._id, invoiceNo: 10, sequenceNumber: 10, date: '2020-05-01', invoiceProducts: [sampleProduct()], invoiceTotal: 100, grandTotal: 100 });
    const result = await authAgent(token).get(`/api/invoice/${old._id}`);
    expect(result.status).toBe(200);
    expect(result.body.invoice.issuedSnapshot).toBeUndefined();
    expect(result.body.invoice.grandTotal).toBe(100);
  });
});
