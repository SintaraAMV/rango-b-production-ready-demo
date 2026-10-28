'use strict';

const assert = require('assert');
const { Client } = require('pg');

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const dbUrl = process.env.DATABASE_URL;

function cookieJar() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    let data = null;
    if (res.status !== 204) data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
}

async function login(as, username, password) {
  const r = await as('POST', '/api/login', { username, password });
  assert.equal(r.status, 200);
  return r.data.user;
}

async function main() {
  let passed = 0;
  const check = async (name, fn) => {
    await fn();
    passed += 1;
    console.log(`PASS ${passed}: ${name}`);
  };

  const anon = cookieJar();
  const alice = cookieJar();
  const bob = cookieJar();
  const admin = cookieJar();

  await check('liveness responde', async () => assert.equal((await anon('GET', '/health')).status, 200));
  await check('readiness comprueba PostgreSQL', async () => assert.equal((await anon('GET', '/ready')).status, 200));
  await check('anónimo no accede a notas', async () => assert.equal((await anon('GET', '/api/notes')).status, 401));
  await check('login inválido controlado', async () => assert.equal((await anon('POST', '/api/login', { username: 'alice', password: 'incorrecta' })).status, 401));

  await login(alice, 'alice', 'Alice-demo-2026');
  await login(bob, 'bob', 'Bob-demo-2026');
  await login(admin, 'admin', 'Admin-demo-2026');

  const aNotes = await alice('GET', '/api/notes');
  const bNotes = await bob('GET', '/api/notes');
  const bobId = bNotes.data.notes[0].id;

  await check('Alice solo lista sus notas', async () => {
    const aliceOwnerIds = new Set(aNotes.data.notes.map(n => n.owner_id));
    const bobOwnerIds = new Set(bNotes.data.notes.map(n => n.owner_id));
    assert.equal(aliceOwnerIds.size, 1);
    assert.equal(bobOwnerIds.size, 1);
    assert.notEqual([...aliceOwnerIds][0], [...bobOwnerIds][0]);
  });
  await check('Alice no puede leer nota de Bob', async () => assert.equal((await alice('GET', `/api/notes/${bobId}`)).status, 404));
  await check('Alice no puede editar nota de Bob', async () => assert.equal((await alice('PUT', `/api/notes/${bobId}`, { title: 'x', body: 'x' })).status, 404));
  await check('Alice no puede borrar nota de Bob', async () => assert.equal((await alice('DELETE', `/api/notes/${bobId}`)).status, 404));
  await check('Bob no puede usar vista admin', async () => assert.equal((await bob('GET', '/api/admin/notes')).status, 403));
  await check('Admin sí puede usar vista admin', async () => assert.equal((await admin('GET', '/api/admin/notes')).status, 200));
  await check('input inválido retorna 400', async () => assert.equal((await alice('POST', '/api/notes', { title: '', body: 'x' })).status, 400));

  const created = await alice('POST', '/api/notes', { title: 'PR persistence check', body: 'persist me' });
  await check('crear nota funciona', async () => assert.equal(created.status, 201));
  const createdId = created.data.note.id;
  await check('nota creada se relee', async () => assert.equal((await alice('GET', `/api/notes/${createdId}`)).data.note.body, 'persist me'));
  await check('edición propia funciona', async () => assert.equal((await alice('PUT', `/api/notes/${createdId}`, { title: 'PR persistence check', body: 'persisted after update' })).status, 200));
  await check('404 API controlado', async () => assert.equal((await alice('GET', '/api/no-existe')).status, 404));

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  const row = await client.query('SELECT title, body FROM notes WHERE id = $1', [createdId]);
  await client.end();
  await check('persistencia confirmada directamente en PostgreSQL', async () => assert.equal(row.rows[0].body, 'persisted after update'));

  console.log(`RESULT ${passed}/${passed} PASS`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
