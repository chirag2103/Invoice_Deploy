import request from 'supertest';
import app from '../../app.js';

let counter = 0;

/** Registers a throwaway user via the real API and returns their token. */
export const makeUser = async (overrides = {}) => {
  counter += 1;
  const email = overrides.email || `test_${Date.now()}_${counter}@example.com`;
  const password = overrides.password || 'password12345';

  const res = await request(app)
    .post('/api/register')
    .send({
      name: overrides.name || 'Test User',
      email,
      password,
      avatar: { public_id: 'x', url: 'x' },
    });

  if (res.status !== 201) {
    throw new Error(`makeUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, user: res.body.user, email, password };
};

/** supertest agent pre-authenticated with a bearer token. */
export const authAgent = (token) => {
  const agent = request(app);
  const withAuth = (req) => req.set('Authorization', `Bearer ${token}`);
  return {
    get: (url) => withAuth(agent.get(url)),
    post: (url) => withAuth(agent.post(url)),
    put: (url) => withAuth(agent.put(url)),
    delete: (url) => withAuth(agent.delete(url)),
  };
};

export const makeCustomer = async (token, overrides = {}) => {
  const api = authAgent(token);
  const res = await api.post('/api/customer/new').send({
    name: overrides.name || `Customer ${Date.now()}_${Math.random()}`,
    gstNo: overrides.gstNo || '24ABCDE1234F1Z5',
    address: overrides.address || 'Test address',
    openingBalance: overrides.openingBalance || 0,
  });

  if (res.status !== 201) {
    throw new Error(
      `makeCustomer failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  return res.body.customer;
};

export const makeSeller = async (token, overrides = {}) => {
  const api = authAgent(token);
  const res = await api.post('/api/seller/new').send({
    name: overrides.name || `Seller ${Date.now()}_${Math.random()}`,
    gstNo: overrides.gstNo || '24AAAAA1111A1Z1',
    address: overrides.address || 'Test address',
    contact: overrides.contact || '9999999999',
    openingBalance: overrides.openingBalance || 0,
  });

  if (res.status !== 201) {
    throw new Error(
      `makeSeller failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  return res.body.seller;
};

export const sampleProduct = (overrides = {}) => ({
  name: 'Test Item',
  quantity: 1,
  rate: 100,
  discount: 0,
  uom: 'NOS',
  ...overrides,
});
