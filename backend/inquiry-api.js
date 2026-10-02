'use strict';

const { database } = require('./database');
const { currentUser } = require('./auth');
const { createNotification } = require('./notification-api');

const CATEGORIES = new Set(['매물 이용', '계약 안전', '로그인·계정', '서비스 오류', '기타']);
const STATUSES = new Set(['received', 'in_progress', 'answered']);

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(Object.assign(new Error('요청 데이터가 너무 큽니다.'), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (error) {
        reject(Object.assign(new Error('JSON 형식이 올바르지 않습니다.'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function requireUser(request, response, adminOnly = false) {
  const user = currentUser(request);
  if (!user) {
    json(response, 401, { message: '로그인이 필요합니다.' });
    return null;
  }
  if (adminOnly && user.role !== 'admin') {
    json(response, 403, { message: '관리자 권한이 필요합니다.' });
    return null;
  }
  return user;
}

function inquiry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    category: row.category,
    title: row.title,
    message: row.content,
    email: row.contact_email,
    status: row.status,
    answer: row.answer,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateNewInquiry(payload) {
  const category = String(payload.category || '').trim();
  const title = String(payload.title || '').trim();
  const content = String(payload.message || payload.content || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  if (!CATEGORIES.has(category)) return '문의 유형을 확인해 주세요.';
  if (title.length < 2 || title.length > 60) return '제목은 2~60자로 입력해 주세요.';
  if (content.length < 5 || content.length > 1000) return '문의 내용은 5~1000자로 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return '답변받을 이메일을 확인해 주세요.';
  return '';
}

async function handleInquiryRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/inquiries') && !pathname.startsWith('/api/admin/inquiries')) return false;
  try {
    if (pathname === '/api/inquiries' && request.method === 'GET') {
      const user = requireUser(request, response);
      if (!user) return true;
      const rows = database.prepare(`
        SELECT inquiries.*, users.username
        FROM inquiries JOIN users ON users.id = inquiries.user_id
        WHERE inquiries.user_id = ? ORDER BY inquiries.id DESC
      `).all(user.userId);
      json(response, 200, { items: rows.map(inquiry) });
      return true;
    }

    if (pathname === '/api/inquiries' && request.method === 'POST') {
      const user = requireUser(request, response);
      if (!user) return true;
      const payload = await readJson(request);
      const error = validateNewInquiry(payload);
      if (error) {
        json(response, 400, { message: error });
        return true;
      }
      const now = new Date().toISOString();
      const result = database.prepare(`
        INSERT INTO inquiries (user_id, category, title, content, contact_email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.userId,
        String(payload.category).trim(),
        String(payload.title).trim(),
        String(payload.message || payload.content).trim(),
        String(payload.email).trim().toLowerCase(),
        now,
        now
      );
      const row = database.prepare(`
        SELECT inquiries.*, users.username
        FROM inquiries JOIN users ON users.id = inquiries.user_id
        WHERE inquiries.id = ?
      `).get(Number(result.lastInsertRowid));
      json(response, 201, { item: inquiry(row) });
      return true;
    }

    const memberDetail = /^\/api\/inquiries\/(\d+)$/.exec(pathname);
    if (memberDetail && request.method === 'GET') {
      const user = requireUser(request, response);
      if (!user) return true;
      const row = database.prepare(`
        SELECT inquiries.*, users.username
        FROM inquiries JOIN users ON users.id = inquiries.user_id
        WHERE inquiries.id = ? AND inquiries.user_id = ?
      `).get(Number(memberDetail[1]), user.userId);
      if (!row) json(response, 404, { message: '문의를 찾을 수 없습니다.' });
      else json(response, 200, { item: inquiry(row) });
      return true;
    }

    if (pathname === '/api/admin/inquiries' && request.method === 'GET') {
      const user = requireUser(request, response, true);
      if (!user) return true;
      const rows = database.prepare(`
        SELECT inquiries.*, users.username
        FROM inquiries JOIN users ON users.id = inquiries.user_id
        ORDER BY inquiries.id DESC
      `).all();
      json(response, 200, { items: rows.map(inquiry) });
      return true;
    }

    const adminAnswer = /^\/api\/admin\/inquiries\/(\d+)\/answer$/.exec(pathname);
    if (adminAnswer && request.method === 'PATCH') {
      const user = requireUser(request, response, true);
      if (!user) return true;
      const payload = await readJson(request);
      const status = String(payload.status || '').trim();
      const answer = String(payload.answer || '').trim();
      if (!STATUSES.has(status)) {
        json(response, 400, { message: '문의 처리 상태를 확인해 주세요.' });
        return true;
      }
      if (answer.length > 3000 || (status === 'answered' && answer.length < 2)) {
        json(response, 400, { message: '답변 완료 시 2~3000자의 답변을 입력해 주세요.' });
        return true;
      }
      const now = new Date().toISOString();
      const result = database.prepare(`
        UPDATE inquiries
        SET status = ?, answer = ?, answered_by = ?, answered_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, answer, answer ? user.userId : null, answer ? now : null, now, Number(adminAnswer[1]));
      if (!result.changes) {
        json(response, 404, { message: '문의를 찾을 수 없습니다.' });
        return true;
      }
      if (status === 'answered') {
        const target = database.prepare('SELECT user_id, title FROM inquiries WHERE id = ?').get(Number(adminAnswer[1]));
        createNotification(target.user_id, 'inquiry_answer', '문의 답변이 등록되었습니다.', target.title, 'inquiry', adminAnswer[1]);
      }
      const row = database.prepare(`
        SELECT inquiries.*, users.username
        FROM inquiries JOIN users ON users.id = inquiries.user_id
        WHERE inquiries.id = ?
      `).get(Number(adminAnswer[1]));
      json(response, 200, { item: inquiry(row) });
      return true;
    }

    json(response, 405, { message: '지원하지 않는 문의 요청입니다.' });
    return true;
  } catch (error) {
    json(response, error.status || 500, {
      message: error.status ? error.message : '문의 데이터를 처리하지 못했습니다.'
    });
    return true;
  }
}

module.exports = { handleInquiryRoute };
