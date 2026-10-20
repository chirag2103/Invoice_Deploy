import User from '../models/userModel.js';
import { authAgent, makeUser } from './helpers/index.js';

describe('existing admin user-management capabilities', () => {
  it('blocks ordinary users from inspecting, changing, or deleting another account', async () => {
    const ordinary = await makeUser();
    const target = await makeUser();
    const api = authAgent(ordinary.token);
    const url = `/api/admin/user/${target.user._id}`;
    expect((await api.get(url)).status).toBe(403);
    expect((await api.put(url).send({ role: 'admin' })).status).toBe(403);
    expect((await api.delete(url)).status).toBe(403);
  });

  it('lets an admin inspect, update, and delete an account', async () => {
    const admin = await makeUser();
    const target = await makeUser();
    await User.updateOne({ _id: admin.user._id }, { role: 'admin' });
    const api = authAgent(admin.token);
    const url = `/api/admin/user/${target.user._id}`;
    const detail = await api.get(url);
    expect(detail.status).toBe(200);
    expect(detail.body.user.password).toBeUndefined();
    expect((await api.put(url).send({ name: 'Updated', email: target.email, role: 'admin' })).status).toBe(200);
    expect((await api.get(url)).body.user.role).toBe('admin');
    expect((await api.delete(url)).status).toBe(200);
  });
});
