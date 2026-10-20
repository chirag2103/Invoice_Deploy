import api from '../axiosSetup';
import { advanceSession } from './session';

jest.mock('axios', () => {
  const client = {
    interceptors: {
      request: { use: (handler) => { client.onRequest = handler; } },
      response: { use: (success, failure) => { client.onResponse = success; client.onFailure = failure; } },
    },
  };
  return {
    create: () => client,
    CanceledError: class extends Error { constructor(message) { super(message); this.code = 'ERR_CANCELED'; } },
  };
});

afterEach(() => localStorage.clear());

test('successful responses from an old session are cancelled', () => {
  const config = api.onRequest({ headers: {} });
  advanceSession();
  expect(() => api.onResponse({ config, data: { private: true } })).toThrow('Session changed');
});

test('an old request returning 401 cannot log out the newly signed-in account', async () => {
  localStorage.setItem('token', 'old');
  const config = api.onRequest({ headers: {}, url: '/api/invoices' });
  advanceSession();
  localStorage.setItem('token', 'new');
  localStorage.setItem('user', '{"_id":"new"}');
  await expect(api.onFailure({ config, response: { status: 401 } })).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  expect(localStorage.getItem('token')).toBe('new');
});
