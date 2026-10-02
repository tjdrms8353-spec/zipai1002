'use strict';

const { database } = require('./database');
const { currentUser } = require('./auth');

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) return reject(Object.assign(new Error('요청이 너무 큽니다.'), { status: 413 }));
      chunks.push(chunk);
    });
    request.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (error) { reject(Object.assign(new Error('JSON 형식이 올바르지 않습니다.'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) json(response, 401, { message: '로그인이 필요합니다.' });
  return user;
}

function propertyPayload(row) {
  const payload = JSON.parse(row.payload_json);
  return { ...payload, id: row.id, ownerId: row.owner_id, status: row.status, createdAt: row.created_at };
}

async function handlePropertyRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/properties') && pathname !== '/api/favorites') return false;
  try {
    if (pathname === '/api/properties/mine' && request.method === 'GET') {
      const user = requireUser(request, response);
      if (!user) return true;
      const rows = database.prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY id DESC').all(user.userId);
      json(response, 200, { items: rows.map(propertyPayload) });
      return true;
    }
    if (pathname === '/api/properties' && request.method === 'POST') {
      const user = requireUser(request, response);
      if (!user) return true;
      const payload = await readJson(request);
      if (!String(payload.title || '').trim() || !String(payload.address || '').startsWith('경기도 ')) {
        json(response, 400, { message: '경기도 매물 제목과 주소를 확인해 주세요.' });
        return true;
      }
      const now = new Date().toISOString();
      const result = database.prepare('INSERT INTO properties (owner_id, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(user.userId, JSON.stringify(payload), now, now);
      const row = database.prepare('SELECT * FROM properties WHERE id = ?').get(Number(result.lastInsertRowid));
      json(response, 201, { item: propertyPayload(row) });
      return true;
    }
    if (pathname === '/api/favorites' && request.method === 'GET') {
      const user = requireUser(request, response);
      if (!user) return true;
      const items = database.prepare('SELECT property_id FROM favorites WHERE user_id = ? ORDER BY created_at').all(user.userId);
      json(response, 200, { ids: items.map((item) => Number(item.property_id)) });
      return true;
    }
    if (pathname === '/api/favorites' && request.method === 'PUT') {
      const user = requireUser(request, response);
      if (!user) return true;
      const payload = await readJson(request);
      const ids = Array.from(new Set((Array.isArray(payload.ids) ? payload.ids : []).map(String))).slice(0, 500);
      database.exec('BEGIN');
      try {
        database.prepare('DELETE FROM favorites WHERE user_id = ?').run(user.userId);
        const insert = database.prepare('INSERT INTO favorites (user_id, property_id, created_at) VALUES (?, ?, ?)');
        const now = new Date().toISOString();
        ids.forEach((id) => insert.run(user.userId, id, now));
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
      json(response, 200, { ids: ids.map(Number) });
      return true;
    }
    json(response, 405, { message: '지원하지 않는 요청입니다.' });
    return true;
  } catch (error) {
    json(response, error.status || 500, { message: error.status ? error.message : '매물 데이터를 처리하지 못했습니다.' });
    return true;
  }
}

module.exports = { handlePropertyRoute };
