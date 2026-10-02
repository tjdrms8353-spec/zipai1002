'use strict';

const { database } = require('./database');
const { currentUser } = require('./auth');

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function createNotification(userId, type, title, message, relatedType = '', relatedId = '') {
  database.prepare(`
    INSERT INTO notifications (user_id, type, title, message, related_type, related_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, type, title, message, relatedType, String(relatedId), new Date().toISOString());
}

async function handleNotificationRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/notifications')) return false;
  const user = currentUser(request);
  if (!user) {
    json(response, 401, { message: '로그인이 필요합니다.' });
    return true;
  }
  try {
    if (pathname === '/api/notifications' && request.method === 'GET') {
      const rows = database.prepare(`
        SELECT id, type, title, message, related_type AS relatedType, related_id AS relatedId,
               read_at AS readAt, created_at AS createdAt
        FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100
      `).all(user.userId);
      const unread = database.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL').get(user.userId);
      json(response, 200, { items: rows, unreadCount: unread.count });
      return true;
    }
    const match = /^\/api\/notifications\/(\d+)\/read$/.exec(pathname);
    if (match && request.method === 'PATCH') {
      const result = database.prepare(`
        UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?
      `).run(new Date().toISOString(), Number(match[1]), user.userId);
      if (!result.changes) json(response, 404, { message: '알림을 찾을 수 없습니다.' });
      else json(response, 200, { success: true });
      return true;
    }
    if (pathname === '/api/notifications/read-all' && request.method === 'PATCH') {
      database.prepare('UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ?')
        .run(new Date().toISOString(), user.userId);
      json(response, 200, { success: true });
      return true;
    }
    json(response, 405, { message: '지원하지 않는 알림 요청입니다.' });
    return true;
  } catch (error) {
    json(response, 500, { message: '알림 데이터를 처리하지 못했습니다.' });
    return true;
  }
}

module.exports = { createNotification, handleNotificationRoute };
