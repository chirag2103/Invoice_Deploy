import request from 'supertest';
import app from '../app.js';
import { authAgent, makeUser } from './helpers/index.js';

describe('auth', () => {
  it('registers and logs in', async () => {
    const email = `auth_${Date.now()}@example.com`;
    const password = 'password12345';

    const registerRes = await request(app).post('/api/register').send({
      name: 'Auth Test',
      email,
      password,
      avatar: { public_id: 'x', url: 'x' },
    });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTruthy();

    const loginRes = await request(app)
      .post('/api/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });

  it('rejects a wrong password without crashing', async () => {
    const { email } = await makeUser();
    const res = await request(app)
      .post('/api/login')
      .send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('mass assignment: profile update cannot escalate role', async () => {
    const { token } = await makeUser();
    await authAgent(token)
      .put('/api/user/me/update')
      .send({ name: 'Still Me', role: 'admin' });

    const me = await authAgent(token).get('/api/user/me');
    expect(me.body.user.role).toBe('user');
  });

  // Regression test for the Phase 1 bug: userModel's pre('save') hook was
  // missing `return next()`, so ANY user.save() — even one that never
  // touches the password field — re-hashed the already-hashed password,
  // corrupting it and permanently breaking login. forgotPassword's
  // user.save({validateBeforeSave:false}) (to persist the reset token) is
  // exactly that kind of call: it saves the document without modifying
  // `password` at all.
  it('forgotPassword does not corrupt the password hash', async () => {
    const { email, password } = await makeUser();

    // Email isn't configured in the test env, so this 500s — that's fine;
    // the reset-token save() already ran by the time sendEmail is attempted,
    // which is the side effect we're checking for.
    await request(app).post('/api/user/forgotPassword').send({ email });

    const loginRes = await request(app)
      .post('/api/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
  });

  it('updatePassword works end-to-end (regression: used to call a non-existent method)', async () => {
    const { token, email, password } = await makeUser();
    const newPassword = 'newpassword12345';

    const res = await authAgent(token)
      .put('/api/user/password/update')
      .send({ oldPassword: password, newPassword, confirmPassword: newPassword });
    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/login')
      .send({ email, password: newPassword });
    expect(loginRes.status).toBe(200);
  });
});
