/* eslint-disable flowtype/require-valid-file-annotation */
import TestServer from 'fetch-test-server';
import app from '../app';
import { flushdb } from '../test/support';
import { buildUser, buildGroup } from '../test/factories';

const server = new TestServer(app.callback());

beforeEach(flushdb);
afterAll(server.close);

describe('#groups.create', async () => {
  it('should create a group', async () => {
    const name = 'hello I am a group';
    const user = await buildUser({ isAdmin: true });

    const res = await server.post('/api/groups.create', {
      body: { token: user.getJwtToken(), name },
    });

    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.data.name).toEqual(name);
  });
});

describe('#groups.update', async () => {
  it('should require authentication', async () => {
    const group = await buildGroup();
    const res = await server.post('/api/groups.update', {
      body: { id: group.id, name: 'Test' },
    });
    const body = await res.json();

    expect(res.status).toEqual(401);
    expect(body).toMatchSnapshot();
  });

  it('should require admin', async () => {
    const group = await buildGroup();
    const user = await buildUser();
    const res = await server.post('/api/groups.update', {
      body: { token: user.getJwtToken(), id: group.id, name: 'Test' },
    });
    expect(res.status).toEqual(403);
  });

  it('should require authorization', async () => {
    const user = await buildUser({ isAdmin: true });
    const group = await buildGroup();

    const res = await server.post('/api/groups.update', {
      body: { token: user.getJwtToken(), id: group.id, name: 'Test' },
    });
    expect(res.status).toEqual(403);
  });

  it('allows admin to edit a group', async () => {
    const user = await buildUser({ isAdmin: true });
    const group = await buildGroup({ teamId: user.teamId });

    const res = await server.post('/api/groups.update', {
      body: { token: user.getJwtToken(), id: group.id, name: 'Test' },
    });

    const body = await res.json();
    expect(res.status).toEqual(200);
    expect(body.data.name).toBe('Test');
  });
});
