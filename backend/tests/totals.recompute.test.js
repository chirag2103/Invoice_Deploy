import { authAgent, makeCustomer, makeUser, sampleProduct } from './helpers/index.js';

describe('server-side money recompute', () => {
  it('ignores a client-sent grandTotal and recomputes from line items', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    const res = await api.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9, // half-rate => 18% total
      gstType: 'intraState',
      invoiceDiscount: 0,
      date: '2025-06-15',
      invoiceProducts: [sampleProduct({ quantity: 2, rate: 100, discount: 0 })],
      grandTotal: 1, // deliberately wrong
      invoiceTotal: 999999,
    });

    expect(res.status).toBe(201);
    // 2 * 100 = 200 taxable, +18% => 236
    expect(res.body.invoice.invoiceTotal).toBe(200);
    expect(res.body.invoice.grandTotal).toBe(236);
    expect(res.body.invoice.taxBreakup.cgst).toBe(18);
    expect(res.body.invoice.taxBreakup.sgst).toBe(18);
  });

  it('splits inter-state GST as IGST, not CGST+SGST', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    const res = await api.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'interState',
      date: '2025-06-15',
      invoiceProducts: [sampleProduct({ quantity: 1, rate: 1000, discount: 0 })],
    });

    expect(res.status).toBe(201);
    expect(res.body.invoice.taxBreakup.igst).toBe(180);
    expect(res.body.invoice.taxBreakup.cgst).toBe(0);
    expect(res.body.invoice.taxBreakup.sgst).toBe(0);
  });

  it('rejects create/update without required fields instead of trusting the client', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);

    const res = await api.post('/api/invoice/new').send({
      // no customer, no products
      date: '2025-06-15',
    });
    expect(res.status).toBe(400);
  });

  it('mass assignment: client-supplied invoiceNo/user are ignored on create', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    const res = await api.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-06-15',
      invoiceProducts: [sampleProduct()],
      invoiceNo: 424242,
      user: '000000000000000000000000',
    });

    expect(res.status).toBe(201);
    expect(res.body.invoice.invoiceNo).not.toBe(424242);
    expect(String(res.body.invoice.user)).not.toBe('000000000000000000000000');
  });
});
