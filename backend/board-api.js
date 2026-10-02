'use strict';

const { database } = require('./database');
const { currentUser } = require('./auth');

const categories = new Set(['review', 'tip', 'question', 'free']);

function sendJson(response, status, payload) {
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
      if (size > 1024 * 1024) {
        reject(Object.assign(new Error('요청 데이터가 너무 큽니다.'), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(Object.assign(new Error('올바른 JSON 형식이 아닙니다.'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) sendJson(response, 401, { message: '로그인이 필요한 회원 전용 기능입니다.' });
  return user;
}

const postSelect = `
  SELECT p.*, u.username AS author,
    (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS likes,
    (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
  FROM community_posts p
  JOIN users u ON u.id = p.author_id
`;

function mapPost(row, userId) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    author: row.author,
    authorId: row.author_id,
    area: row.area,
    rating: row.rating,
    likes: row.likes,
    views: row.views,
    commentCount: row.comment_count,
    liked: Boolean(database.prepare(
      'SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_id = ?'
    ).get(row.id, userId)),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getPost(id, userId) {
  const row = database.prepare(`${postSelect} WHERE p.id = ?`).get(id);
  return row ? mapPost(row, userId) : null;
}

async function handleBoardRoute(request, response, pathname) {
  if (!pathname.startsWith('/api/community')) return false;
  try {
    const user = requireUser(request, response);
    if (!user) return true;

    if (request.method === 'GET' && pathname === '/api/community/posts') {
      const rows = database.prepare(`${postSelect} ORDER BY p.created_at DESC`).all();
      sendJson(response, 200, { items: rows.map((row) => mapPost(row, user.userId)) });
      return true;
    }

    if (request.method === 'POST' && pathname === '/api/community/posts') {
      const payload = await readJson(request);
      const category = String(payload.category || '');
      const title = String(payload.title || '').trim();
      const content = String(payload.content || '').trim();
      const area = String(payload.area || '').trim();
      const rating = category === 'review' ? Number(payload.rating || 0) : 0;
      if (!categories.has(category) || title.length < 2 || title.length > 60 ||
          content.length < 2 || content.length > 2000 || area.length > 30 ||
          !Number.isInteger(rating) || rating < 0 || rating > 5) {
        sendJson(response, 400, { message: '게시글 입력 내용을 확인해 주세요.' });
        return true;
      }
      const now = new Date().toISOString();
      const result = database.prepare(`
        INSERT INTO community_posts
          (author_id, category, title, content, area, rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user.userId, category, title, content, area, rating, now, now);
      sendJson(response, 201, { item: getPost(Number(result.lastInsertRowid), user.userId) });
      return true;
    }

    const postMatch = /^\/api\/community\/posts\/(\d+)$/.exec(pathname);
    if (postMatch && request.method === 'GET') {
      const id = Number(postMatch[1]);
      const exists = database.prepare('SELECT 1 FROM community_posts WHERE id = ?').get(id);
      if (!exists) {
        sendJson(response, 404, { message: '게시글을 찾을 수 없습니다.' });
        return true;
      }
      database.prepare('UPDATE community_posts SET views = views + 1 WHERE id = ?').run(id);
      sendJson(response, 200, { item: getPost(id, user.userId) });
      return true;
    }

    const likeMatch = /^\/api\/community\/posts\/(\d+)\/like$/.exec(pathname);
    if (likeMatch && request.method === 'PUT') {
      const id = Number(likeMatch[1]);
      if (!database.prepare('SELECT 1 FROM community_posts WHERE id = ?').get(id)) {
        sendJson(response, 404, { message: '게시글을 찾을 수 없습니다.' });
        return true;
      }
      const result = database.prepare(`
        INSERT OR IGNORE INTO community_post_likes (post_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).run(id, user.userId, new Date().toISOString());
      const likes = database.prepare(
        'SELECT COUNT(*) AS count FROM community_post_likes WHERE post_id = ?'
      ).get(id).count;
      sendJson(response, 200, { liked: true, added: result.changes > 0, likes });
      return true;
    }

    const commentsMatch = /^\/api\/community\/posts\/(\d+)\/comments$/.exec(pathname);
    if (commentsMatch && request.method === 'GET') {
      const rows = database.prepare(`
        SELECT c.id, c.content, c.created_at, u.username AS author
        FROM community_comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).all(Number(commentsMatch[1]));
      sendJson(response, 200, {
        items: rows.map((row) => ({
          id: row.id, content: row.content, author: row.author, createdAt: row.created_at
        }))
      });
      return true;
    }

    if (commentsMatch && request.method === 'POST') {
      const postId = Number(commentsMatch[1]);
      if (!database.prepare('SELECT 1 FROM community_posts WHERE id = ?').get(postId)) {
        sendJson(response, 404, { message: '게시글을 찾을 수 없습니다.' });
        return true;
      }
      const payload = await readJson(request);
      const content = String(payload.content || '').trim();
      if (!content || content.length > 500) {
        sendJson(response, 400, { message: '댓글을 1~500자로 입력해 주세요.' });
        return true;
      }
      const now = new Date().toISOString();
      const result = database.prepare(`
        INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(postId, user.userId, content, now, now);
      sendJson(response, 201, {
        item: { id: Number(result.lastInsertRowid), content, author: user.id, createdAt: now }
      });
      return true;
    }

    sendJson(response, 405, { message: '지원하지 않는 게시판 요청입니다.' });
    return true;
  } catch (error) {
    sendJson(response, error.status || 500, {
      message: error.status ? error.message : '게시판 데이터를 처리하지 못했습니다.'
    });
    return true;
  }
}

module.exports = { handleBoardRoute };
