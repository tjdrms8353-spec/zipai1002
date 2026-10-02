'use strict';

const { database } = require('./database');
const { currentUser } = require('./auth');
const { createNotification } = require('./notification-api');

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
      if (size > 64 * 1024) return reject(Object.assign(new Error('요청이 너무 큽니다.'), { status: 413 }));
      chunks.push(chunk);
    });
    request.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (error) { reject(Object.assign(new Error('JSON 형식이 올바르지 않습니다.'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function requireAdmin(request, response) {
  const user = currentUser(request);
  if (!user) json(response, 401, { message: '로그인이 필요합니다.' });
  else if (user.role !== 'admin') json(response, 403, { message: '관리자 권한이 필요합니다.' });
  else return user;
  return null;
}

async function handleAdminRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/admin/') || pathname.startsWith('/api/admin/inquiries')) return false;
  try {
    const admin = requireAdmin(request, response);
    if (!admin) return true;

    if (pathname === '/api/admin/properties' && request.method === 'GET') {
      const rows = database.prepare(`
        SELECT properties.*, users.username FROM properties
        JOIN users ON users.id = properties.owner_id ORDER BY properties.id DESC
      `).all();
      json(response, 200, { items: rows.map((row) => ({
        ...JSON.parse(row.payload_json), id: row.id, ownerId: row.owner_id,
        owner: row.username, status: row.status, createdAt: row.created_at
      })) });
      return true;
    }

    const propertyMatch = /^\/api\/admin\/properties\/(\d+)\/status$/.exec(pathname);
    if (propertyMatch && request.method === 'PATCH') {
      const payload = await readJson(request);
      const status = String(payload.status || '');
      if (!['approved', 'rejected', 'closed'].includes(status)) {
        json(response, 400, { message: '매물 처리 상태를 확인해 주세요.' });
        return true;
      }
      const row = database.prepare('SELECT id, owner_id, payload_json FROM properties WHERE id = ?').get(Number(propertyMatch[1]));
      if (!row) {
        json(response, 404, { message: '매물을 찾을 수 없습니다.' });
        return true;
      }
      database.prepare('UPDATE properties SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, new Date().toISOString(), row.id);
      const title = JSON.parse(row.payload_json).title || `매물 #${row.id}`;
      const label = status === 'approved' ? '승인' : status === 'rejected' ? '거절' : '종료';
      createNotification(row.owner_id, 'property_review', '매물 검토 결과', `${title} 매물이 ${label} 처리되었습니다.`, 'property', row.id);
      json(response, 200, { success: true, status });
      return true;
    }

    if (pathname === '/api/admin/community/posts' && request.method === 'GET') {
      const rows = database.prepare(`
        SELECT community_posts.*, users.username FROM community_posts
        JOIN users ON users.id = community_posts.author_id ORDER BY community_posts.id DESC
      `).all();
      json(response, 200, { items: rows });
      return true;
    }

    const postMatch = /^\/api\/admin\/community\/posts\/(\d+)$/.exec(pathname);
    if (postMatch && request.method === 'DELETE') {
      const result = database.prepare('DELETE FROM community_posts WHERE id = ?').run(Number(postMatch[1]));
      if (!result.changes) json(response, 404, { message: '게시글을 찾을 수 없습니다.' });
      else json(response, 200, { success: true });
      return true;
    }

    json(response, 405, { message: '지원하지 않는 관리자 요청입니다.' });
    return true;
  } catch (error) {
    json(response, error.status || 500, { message: error.status ? error.message : '관리자 요청을 처리하지 못했습니다.' });
    return true;
  }
}

module.exports = { handleAdminRoute };
