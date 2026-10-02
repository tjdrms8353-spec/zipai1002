'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { handleAuthRoute } = require('./backend/auth');
const { handlePropertyRoute } = require('./backend/property-api');
const { handleVisitRoute } = require('./backend/visit-api');
const { handleBoardRoute } = require('./backend/board-api');
const { handleInquiryRoute } = require('./backend/inquiry-api');
const { handleAdminRoute } = require('./backend/admin-api');
const { handleNotificationRoute } = require('./backend/notification-api');

const root = __dirname;

function loadLocalEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  lines.forEach((line) => {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) return;
    const separator = entry.indexOf('=');
    if (separator < 1) return;

    const name = entry.slice(0, separator).trim();
    let value = entry.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[name] === undefined) process.env[name] = value;
  });
}

loadLocalEnv();

const port = Number(process.env.PORT || 4173);
const host = String(process.env.HOST || '127.0.0.1');
const serviceKey = String(process.env.PUBLIC_DATA_SERVICE_KEY || '').trim();
const cache = { expiresAt: 0, items: [] };
const rateBuckets = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function applySecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function requestOriginAllowed(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const forwardedProto = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || (request.socket.encrypted ? 'https' : 'http');
  return origin === `${protocol}://${request.headers.host}`;
}

function rateLimit(request, response, pathname) {
  if (!pathname.startsWith('/api/')) return false;
  const address = request.socket.remoteAddress || 'unknown';
  const sensitive = pathname === '/api/auth/login' || pathname === '/api/auth/signup';
  const windowMs = sensitive ? 10 * 60 * 1000 : 60 * 1000;
  const limit = sensitive ? 30 : 240;
  const key = `${address}:${sensitive ? 'auth' : 'api'}`;
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  response.setHeader('RateLimit-Limit', String(limit));
  response.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  response.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.count <= limit) return false;
  json(response, 429, { message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
  return true;
}

function dateText(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function hashNumber(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) + 1000000;
}

function zipEntry(buffer, wantedName) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('Excel ZIP 디렉터리를 찾지 못했습니다.');

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Excel ZIP 항목이 손상되었습니다.');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8').replace(/\\/g, '/');

    if (fileName === wantedName) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Excel ZIP 로컬 항목이 손상되었습니다.');
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return zlib.inflateRawSync(compressed);
      throw new Error(`지원하지 않는 Excel 압축 형식입니다. (${method})`);
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`Excel 내부 파일을 찾지 못했습니다: ${wantedName}`);
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function excelRows(filePath) {
  const workbook = fs.readFileSync(filePath);
  const sheetXml = zipEntry(workbook, 'xl/worksheets/sheet1.xml').toString('utf8');
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = /\br="([A-Z]+)\d+"/.exec(cellMatch[1]);
      if (!reference) continue;
      const inline = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(cellMatch[2]);
      const number = /<v>([\s\S]*?)<\/v>/.exec(cellMatch[2]);
      row[reference[1]] = decodeXml(inline ? inline[1] : number ? number[1] : '');
    }
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => Object.fromEntries(
    Object.keys(headers).map((column) => [headers[column], row[column] || ''])
  ));
}

function adminExcelProperties() {
  const filePath = path.join(root, 'data', 'admin', '성남시_시연용_일반매물_10건.xlsx');
  if (!fs.existsSync(filePath)) return [];
  return excelRows(filePath).filter((row) => row.시도 === '경기도' && row.시군 === '성남시').map((row, index) => ({
    id: hashNumber(row.매물ID),
    title: row.매물제목,
    deal: row.거래유형 === '전세' ? 'jeonse' : 'monthly',
    type: row.방유형,
    deposit: Number(row.보증금_만원 || 0),
    monthly: Number(row.월세_만원 || 0),
    maintenance: Number(row.관리비_만원 || 0),
    area: Number(row['전용면적_㎡'] || 0),
    floor: row.층,
    address: [row.시도, row.시군, row.구, row.동, row.상세주소].filter(Boolean).join(' '),
    walk: `${row.동} 생활권`,
    tags: [row.동, row.거래유형, row.방유형, row.데이터구분].filter(Boolean),
    options: String(row.옵션 || '').split('|').filter(Boolean),
    parking: row.주차 === '가능',
    elevator: row.엘리베이터 === '있음',
    pet: row.반려동물 === '가능',
    safe: 80,
    photos: 0,
    tone: index % 5 + 1,
    lat: Number(row.위도),
    lng: Number(row.경도),
    district: row.시군,
    neighborhood: row.동,
    source: '관리자 Excel · 시연용',
    verifiedAt: `${row.최종확인일} · 실제 계약 불가`,
    status: row.상태,
    isReal: row.실제매물여부 === '예'
  }));
}

function findNoticeRows(value, rows = []) {
  if (Array.isArray(value)) {
    if (value.some((item) => item && typeof item === 'object' && item.PAN_NM)) rows.push(...value);
    else value.forEach((item) => findNoticeRows(item, rows));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => findNoticeRows(item, rows));
  }
  return rows;
}

async function requestLhNotices(typeCode) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setDate(start.getDate() - 120);
  end.setFullYear(end.getFullYear() + 1);

  const endpoint = new URL('https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1');
  endpoint.searchParams.set('ServiceKey', serviceKey);
  endpoint.searchParams.set('PG_SZ', '100');
  endpoint.searchParams.set('PAGE', '1');
  endpoint.searchParams.set('UPP_AIS_TP_CD', typeCode);
  endpoint.searchParams.set('CNP_CD', '41');
  endpoint.searchParams.set('PAN_SS', '공고중');
  endpoint.searchParams.set('PAN_NT_ST_DT', dateText(start));
  endpoint.searchParams.set('CLSG_DT', dateText(end));

  const upstream = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  const text = await upstream.text();
  if (!upstream.ok) throw new Error(`LH API 응답 오류 (${upstream.status})`);

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new Error('LH API 인증키 또는 응답 형식을 확인해 주세요.');
  }
  return findNoticeRows(payload);
}

async function publicHousing(response) {
  if (!serviceKey) {
    json(response, 503, {
      message: 'PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다. 공공데이터포털의 LH 분양·임대공고 조회 서비스를 신청한 뒤 일반 인증키를 서버 환경변수에 넣어 주세요.'
    });
    return;
  }

  if (cache.expiresAt > Date.now()) {
    json(response, 200, { source: 'LH 공공데이터', items: cache.items, cached: true });
    return;
  }

  try {
    const results = await Promise.all([requestLhNotices('06'), requestLhNotices('13')]);
    const seen = new Set();
    const fetchedAt = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const items = results.flat().filter((item) => {
      const key = item.DTL_URL || item.PAN_NM;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return String(item.CNP_CD_NM || '경기').includes('경기') || String(item.PAN_NM || '').includes('경기');
    }).map((item) => ({
      id: hashNumber(item.DTL_URL || item.PAN_NM),
      title: item.PAN_NM,
      type: item.AIS_TP_CD_NM || item.UPP_AIS_TP_NM || '공공임대',
      region: item.CNP_CD_NM || '경기도',
      status: item.PAN_SS || '공고중',
      postedAt: item.PAN_NT_ST_DT || '',
      closeAt: item.CLSG_DT || '',
      detailUrl: item.DTL_URL || 'https://apply.lh.or.kr/',
      fetchedAt
    }));
    cache.items = items;
    cache.expiresAt = Date.now() + 10 * 60 * 1000;
    json(response, 200, { source: 'LH 공공데이터', items, cached: false });
  } catch (error) {
    json(response, 502, { message: error.message });
  }
}

function staticFile(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  } catch (error) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const firstSegment = pathname.split('/').filter(Boolean)[0] || '';
  if (
    firstSegment.startsWith('.') ||
    ['backend', 'data', 'docs', 'node_modules', 'ppt'].includes(firstSegment) ||
    ['/server.js', '/package.json', '/package-lock.json', '/README.md'].includes(pathname)
  ) {
    response.writeHead(404);
    response.end('Not Found');
    return;
  }
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end('Not Found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  applySecurityHeaders(response);
  let pathname;
  try {
    pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
  } catch (error) {
    json(response, 400, { message: '요청 주소가 올바르지 않습니다.' });
    return;
  }
  if (rateLimit(request, response, pathname)) return;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !requestOriginAllowed(request)) {
    json(response, 403, { message: '허용되지 않은 요청 출처입니다.' });
    return;
  }
  if (await handleAuthRoute(request, response, pathname)) return;
  if (await handlePropertyRoute(request, response, pathname)) return;
  if (await handleVisitRoute(request, response, pathname)) return;
  if (await handleBoardRoute(request, response, pathname)) return;
  if (await handleInquiryRoute(request, response, pathname)) return;
  if (await handleAdminRoute(request, response, pathname)) return;
  if (await handleNotificationRoute(request, response, pathname)) return;
  if (request.method === 'GET' && pathname === '/api/general-properties') {
    try {
      const items = adminExcelProperties();
      json(response, 200, { source: '관리자 Excel', items, count: items.length });
    } catch (error) {
      json(response, 500, { message: `관리자 Excel을 읽지 못했습니다: ${error.message}` });
    }
    return;
  }
  if (request.method === 'GET' && pathname === '/api/public-housing') {
    publicHousing(response);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405);
    response.end('Method Not Allowed');
    return;
  }
  staticFile(request, response);
});

server.listen(port, host, () => {
  console.log(`ZipAI Gyeonggi map: http://${host}:${port}`);
  if (!serviceKey) console.log('LH public housing: PUBLIC_DATA_SERVICE_KEY is not configured');
});
