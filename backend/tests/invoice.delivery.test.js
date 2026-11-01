import { authAgent, makeUser, makeCustomer, sampleProduct } from './helpers/index.js';

const delivery = {
  deliveryDate: '2026-11-14',
  disDocNo: 'DD-125',
  dispatchedThrough: 'Example Transport',
  destination: 'Anand',
};

describe('invoice delivery details', () => {
  it('persists delivery details and returns them for single, list, and customer invoice reads', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);
    const created = await api.post('/api/invoice/new').send({
      customer: customer._id, date: '2026-11-01', invoiceProducts: [sampleProduct()], ...delivery,
    });
    expect(created.status).toBe(201);
    const expected = { ...delivery, deliveryDate: '2026-11-14T00:00:00.000Z' };
    expect(created.body.invoice).toMatchObject(expected);
    const id = created.body.invoice._id;
    expect((await api.get(`/api/invoice/${id}`)).body.invoice).toMatchObject(expected);
    expect((await api.get('/api/invoices')).body.invoices[0]).toMatchObject(expected);
    expect((await api.get(`/api/customer/${customer._id}/invoices`)).body.invoices[0]).toMatchObject(expected);

    const updated = await api.put(`/api/invoice/${id}`).send({ destination: 'Vadodara' });
    expect(updated.status).toBe(200);
    expect(updated.body.invoice).toMatchObject({ ...expected, destination: 'Vadodara' });
    const cleared = await api.put(`/api/invoice/${id}`).send({ deliveryDate: '', disDocNo: '', dispatchedThrough: '', destination: '' });
    expect(cleared.status).toBe(200);
    const reread = (await api.get(`/api/invoice/${id}`)).body.invoice;
    expect(reread.deliveryDate).toBeUndefined();
    expect(reread).toMatchObject({ disDocNo: '', dispatchedThrough: '', destination: '' });
  });

  it('allows omitted and blank optional fields and rejects invalid delivery dates', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const customer = await makeCustomer(token);
    const payload = { customer: customer._id, date: '2026-11-01', invoiceProducts: [sampleProduct()] };
    const legacy = await api.post('/api/invoice/new').send(payload);
    expect(legacy.status).toBe(201);
    expect(legacy.body.invoice.deliveryDate).toBeUndefined();
    expect((await api.post('/api/invoice/new').send({ ...payload, deliveryDate: '' })).status).toBe(201);
    expect((await api.put(`/api/invoice/${legacy.body.invoice._id}`).send({ deliveryDate: 'invalid' })).status).toBe(400);
    const unchanged = (await api.get(`/api/invoice/${legacy.body.invoice._id}`)).body.invoice;
    expect(unchanged.deliveryDate).toBeUndefined();
  });
});
