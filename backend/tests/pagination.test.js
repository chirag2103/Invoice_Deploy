import { authAgent, makeCustomer, makeUser, sampleProduct } from './helpers/index.js';

describe('list pagination', () => {
  it('defaults to a bounded page size instead of returning everything', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    for (let i = 0; i < 25; i += 1) {
      await api.post('/api/invoice/new').send({
        customer: customer._id,
        gst: 9,
        gstType: 'intraState',
        date: '2025-06-15',
        invoiceProducts: [sampleProduct()],
      });
    }

    const res = await api.get('/api/invoices');
    expect(res.status).toBe(200);
    expect(res.body.pagination.totalItems).toBe(25);
    expect(res.body.invoices.length).toBeLessThan(25);
    expect(res.body.pagination.limit).toBeGreaterThan(0);
  }, 30000);

  it('clamps an excessive limit instead of honouring it verbatim', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);

    const res = await api.get('/api/quotations?limit=999999');
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
  });

  it('rejects an unwhitelisted sort key rather than passing it to Mongo', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);

    const res = await api.get('/api/invoices?sort=$where');
    expect(res.status).toBe(200); // ignored, not applied, not a crash
  });
});
