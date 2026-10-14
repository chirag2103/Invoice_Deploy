import {
  authAgent,
  makeCustomer,
  makeSeller,
  makeUser,
  sampleProduct,
} from './helpers/index.js';

describe('tenant isolation / ownership', () => {
  it('a second user cannot delete the first user\'s invoice (IDOR)', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const ownerApi = authAgent(owner.token);
    const attackerApi = authAgent(attacker.token);
    const customer = await makeCustomer(owner.token);

    const created = await ownerApi.post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-06-15',
      invoiceProducts: [sampleProduct()],
    });
    expect(created.status).toBe(201);

    const del = await attackerApi.delete(`/api/invoice/${created.body.invoice._id}`);
    expect(del.status).toBe(404);

    const ownDel = await ownerApi.delete(`/api/invoice/${created.body.invoice._id}`);
    expect(ownDel.status).toBe(200);
  });

  it('a second user cannot delete the first user\'s challan (regression: was unscoped)', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const customer = await makeCustomer(owner.token);

    const created = await authAgent(owner.token).post('/api/challan/new').send({
      customer: customer._id,
      challanDate: '2025-06-15',
      challanProducts: [{ name: 'X', quantity: 1, uom: 'NOS' }],
    });
    expect(created.status).toBe(201);

    const del = await authAgent(attacker.token).delete(
      `/api/challan/${created.body.challan._id}`
    );
    expect(del.status).toBe(404);
  });

  it('a second user cannot delete the first user\'s quotation (regression: was unscoped)', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const customer = await makeCustomer(owner.token);

    const created = await authAgent(owner.token).post('/api/quotation/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-06-15',
      quotationProducts: [sampleProduct()],
    });
    expect(created.status).toBe(201);

    const del = await authAgent(attacker.token).delete(
      `/api/quotation/${created.body.quotation._id}`
    );
    expect(del.status).toBe(404);
  });

  it('cannot create an invoice against another tenant\'s customer', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const customer = await makeCustomer(owner.token);

    const res = await authAgent(attacker.token).post('/api/invoice/new').send({
      customer: customer._id,
      gst: 9,
      gstType: 'intraState',
      date: '2025-06-15',
      invoiceProducts: [sampleProduct()],
    });

    expect(res.status).toBe(404);
  });

  it('cannot record a payment against another tenant\'s customer', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const customer = await makeCustomer(owner.token);

    const res = await authAgent(attacker.token).post('/api/payment/new').send({
      customer: customer._id,
      amountPaid: 100,
      date: '2025-06-15',
    });

    expect(res.status).toBe(404);
  });

  it('deleting a purchase bill does not delete that seller\'s payments (regression)', async () => {
    const { token } = await makeUser();
    const api = authAgent(token);
    const seller = await makeSeller(token);

    const bill = await api.post('/api/purchase/new').send({
      seller: seller._id,
      invoiceNo: 'PB-1',
      amount: 1000,
      date: '2025-06-15',
    });
    expect(bill.status).toBe(201);

    const payment = await api.post('/api/purchase/payment/new').send({
      seller: seller._id,
      amountPaid: 400,
      date: '2025-06-16',
    });
    expect(payment.status).toBe(201);

    await api.delete(`/api/purchase/${bill.body.purchase._id}`);

    const payments = await api.get(`/api/purchase/payment/seller/${seller._id}`);
    expect(payments.body.payments).toHaveLength(1);
  });
});
