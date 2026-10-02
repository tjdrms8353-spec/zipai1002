'use strict';

const crypto = require('crypto');
const { database, cleanupExpiredSessions } = require('./database');

const SESSION_COOKIE = 'zipai_session';
const SESSION_DAYS = 7;
const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function validateSignup(payload) {
  const username = normalizeUsername(payload.userId);
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const password = String(payload.password || '');
  if (!/^[A-Za-z0-9_가-힣]{4,20}$/.test(username)) return '아이디는 한글, 영문, 숫자, 밑줄을 사용해 4~20자로 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 주소를 입력해 주세요.';
  if (phone.length < 10 || phone.length > 11) return '올바른 휴대폰 번호를 입력해 주세요.';
  if (password.length < 8 || password.length > 72) return '비밀번호는 8~72자로 입력해 주세요.';
  return '';
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString('hex')
  };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseCookies(request) {
  return String(request.headers.cookie || '').split(';').reduce((cookies, entry) => {
    const separator = entry.indexOf('=');
    if (separator < 1) return cookies;
    const name = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function sessionCookie(token, maxAge) {
  const secure = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAge}`
  ].filter(Boolean).join('; ');
}

function publicUser(user) {
  return {
    id: user.username,
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at
  };
}

function createSession(userId) {
  cleanupExpiredSessions();
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  database.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(tokenHash(token), userId, expiresAt.toISOString(), now.toISOString(), now.toISOString());
  return token;
}

function currentUser(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const now = new Date().toISOString();
  const row = database.prepare(`
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.status = 'active'
  `).get(tokenHash(token), now);
  if (!row) return null;
  database.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(now, tokenHash(token));
  return publicUser(row);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
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
        reject(Object.assign(new Error('JSON 요청 형식이 올바르지 않습니다.'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const expected = `http://${request.headers.host}`;
  const forwarded = request.headers['x-forwarded-proto']
    ? `${request.headers['x-forwarded-proto']}://${request.headers.host}`
    : expected;
  return origin === expected || origin === forwarded;
}

async function handleAuthRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/auth/')) return false;
  if (!sameOrigin(request)) {
    sendJson(response, 403, { message: '허용되지 않은 요청 출처입니다.' });
    return true;
  }
  try {
    if (request.method === 'GET' && pathname === '/api/auth/me') {
      const user = currentUser(request);
      sendJson(response, 200, { authenticated: Boolean(user), user });
      return true;
    }

    if (request.method === 'POST' && pathname === '/api/auth/signup') {
      const payload = await readJson(request);
      const validationError = validateSignup(payload);
      if (validationError) {
        sendJson(response, 400, { message: validationError });
        return true;
      }
      const username = normalizeUsername(payload.userId);
      const email = normalizeEmail(payload.email);
      const phone = normalizePhone(payload.phone);
      const password = hashPassword(String(payload.password));
      const now = new Date().toISOString();
      let result;
      try {
        result = database.prepare(`
          INSERT INTO users (username, email, phone, password_hash, password_salt, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(username, email, phone, password.hash, password.salt, now, now);
      } catch (error) {
        if (String(error.message).includes('users.username')) {
          sendJson(response, 409, { message: '이미 사용 중인 아이디입니다.' });
          return true;
        }
        if (String(error.message).includes('users.email')) {
          sendJson(response, 409, { message: '이미 가입된 이메일입니다.' });
          return true;
        }
        throw error;
      }
      const user = database.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
      const token = createSession(user.id);
      sendJson(response, 201, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
      return true;
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
      const payload = await readJson(request);
      const username = normalizeUsername(payload.userId);
      const password = String(payload.password || '');
      const user = database.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
      if (!user || user.status !== 'active' || !verifyPassword(password, user.password_salt, user.password_hash)) {
        sendJson(response, 401, { message: '아이디 또는 비밀번호를 확인해 주세요.' });
        return true;
      }
      const token = createSession(user.id);
      sendJson(response, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
      return true;
    }

    if (request.method === 'POST' && pathname === '/api/auth/logout') {
      const token = parseCookies(request)[SESSION_COOKIE];
      if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
      sendJson(response, 200, { success: true }, { 'Set-Cookie': sessionCookie('', 0) });
      return true;
    }

    sendJson(response, 404, { message: '인증 API 경로를 찾을 수 없습니다.' });
    return true;
  } catch (error) {
    sendJson(response, error.status || 500, { message: error.status ? error.message : '서버 인증 처리 중 오류가 발생했습니다.' });
    return true;
  }
}

module.exports = {
  handleAuthRoute,
  currentUser
};
