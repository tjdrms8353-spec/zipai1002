'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'zipai-test-'));
const databasePath = path.join(temp, 'test.sqlite');
const port = 43173;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ZIPAI_DB_PATH: databasePath },
  stdio: ['ignore', 'pipe', 'pipe']
});

let memberCookie = '';
let adminCookie = '';

async function request(pathname, options = {}, cookie = '') {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (!['GET', 'HEAD'].includes(options.method || 'GET')) headers.Origin = origin;
  const response = await fetch(origin + pathname, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  return { response, payload, cookie: String(response.headers.get('set-cookie') || '').split(';')[0] };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(origin + '/api/auth/me');
      if (response.ok) return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('테스트 서버가 시작되지 않았습니다.');
}

async function signup(userId, email) {
  const result = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ userId, email, phone: '01012345678', password: 'Testpass123!' })
  });
  assert.equal(result.response.status, 201);
  return result.cookie;
}

(async () => {
  try {
    await waitForServer();
    memberCookie = await signup('testmember', 'member@example.com');
    adminCookie = await signup('testadmin', 'admin@example.com');

    const db = new DatabaseSync(databasePath);
    db.prepare("UPDATE users SET role = 'admin' WHERE username = 'testadmin'").run();
    db.close();

    const created = await request('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        category: '서비스 오류',
        title: '화면 오류 문의',
        email: 'member@example.com',
        message: '화면에서 오류가 발생하여 문의드립니다.'
      })
    }, memberCookie);
    assert.equal(created.response.status, 201);
    const inquiryId = created.payload.item.id;

    const forbidden = await request('/api/admin/inquiries', {}, memberCookie);
    assert.equal(forbidden.response.status, 403);

    const answered = await request(`/api/admin/inquiries/${inquiryId}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'answered', answer: '확인 후 수정했습니다.' })
    }, adminCookie);
    assert.equal(answered.response.status, 200);

    const memberInquiries = await request('/api/inquiries', {}, memberCookie);
    assert.equal(memberInquiries.payload.items[0].answer, '확인 후 수정했습니다.');

    const notifications = await request('/api/notifications', {}, memberCookie);
    assert.equal(notifications.response.status, 200);
    assert.equal(notifications.payload.unreadCount, 1);
    assert.equal(notifications.payload.items[0].type, 'inquiry_answer');

    const property = await request('/api/properties', {
      method: 'POST',
      body: JSON.stringify({ title: '테스트 매물', address: '경기도 성남시 분당구' })
    }, memberCookie);
    assert.equal(property.response.status, 201);
    const propertyId = property.payload.item.id;

    const approved = await request(`/api/admin/properties/${propertyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    }, adminCookie);
    assert.equal(approved.response.status, 200);

    const blockedStatic = await fetch(origin + '/.env');
    assert.equal(blockedStatic.status, 404);
    console.log('backend integration test: PASS');
  } finally {
    if (server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once('exit', resolve));
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
