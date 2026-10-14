import { authAgent, makeCustomer, makeUser, sampleProduct } from './helpers/index.js';

describe('invoice numbering', () => {
  it('allocates sequential numbers with no gaps or duplicates under concurrency', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    const CONCURRENT = 10;
    const results = await Promise.all(
      Array.from({ length: CONCURRENT }, () =>
        api.post('/api/invoice/new').send({
          customer: customer._id,
          gst: 9,
          gstType: 'intraState',
          date: '2025-06-15',
          invoiceProducts: [sampleProduct()],
        })
      )
    );

    results.forEach((res) => expect(res.status).toBe(201));

    const numbers = results.map((res) => res.body.invoice.invoiceNo).sort(
      (a, b) => a - b
    );
    const expected = Array.from({ length: CONCURRENT }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });

  it('disallows moving a numbered invoice to a different financial year', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);

    const create = await api.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-06-15',
      invoiceProducts: [sampleProduct()],
    });
    expect(create.status).toBe(201);

    const move = await api
      .put(`/api/invoice/${create.body.invoice._id}`)
      .send({ date: '2026-06-15' }); // crosses into the next financial year
    expect(move.status).toBe(409);
  });
});
