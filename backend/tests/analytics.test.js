import { authAgent, makeCustomer, makeUser, sampleProduct } from './helpers/index.js';

describe('analytics summary', () => {
  // Regression test: getFinancialYearAnalytics used to $match on a string
  // user id inside an aggregation pipeline, which Mongoose does not
  // auto-cast — every aggregation silently matched zero documents.
  it('reflects real totals instead of always returning zero', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    await api.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-08-05',
      invoiceProducts: [sampleProduct({ quantity: 1, rate: 1000 })],
    });

    const summary = await api.get('/api/analytics/summary?fy=25-26');
    expect(summary.status).toBe(200);
    expect(summary.body.totals.revenue).toBe(1180); // 1000 + 18% GST
    expect(summary.body.totals.invoiceCount).toBe(1);

    const august = summary.body.monthly.find((m) => m.monthKey === '2025-08');
    expect(august.totalInvoices).toBe(1180);
    expect(august.invoiceCount).toBe(1);
  });

  it('rejects a malformed financial year instead of 500ing', async () => {
    const { token } = await makeUser();
    const res = await authAgent(token).get('/api/analytics/summary?fy=not-a-fy');
    expect(res.status).toBe(400);
  });
});
