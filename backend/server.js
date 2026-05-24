const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = path.resolve(__dirname, '..');

const ROUTES = {
  '/api/nonbenefit/region-prices': path.join(ROOT_DIR, 'assets', 'data', 'nonbenefit_region_prices.json'),
  '/api/nonbenefit/code-map': path.join(ROOT_DIR, 'assets', 'data', 'nonbenefit_code_map.json')
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'MEDICost backend',
      updatedAt: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/nonbenefit/regions') {
    const prices = await readJsonFile(ROUTES['/api/nonbenefit/region-prices']);
    const regions = {};
    Object.values(prices.items || {}).forEach(item => {
      Object.entries(item.regions || {}).forEach(([code, region]) => {
        if (!regions[code]) regions[code] = { name: region.name || code };
      });
    });
    sendJson(res, 200, { fetchedAt: prices.fetchedAt, regions });
    return;
  }

  const filePath = ROUTES[pathname];
  if (!filePath) {
    sendJson(res, 404, { error: '지원하지 않는 API 경로입니다.' });
    return;
  }

  sendJson(res, 200, await readJsonFile(filePath));
}

async function handleStatic(req, res, pathname) {
  const safePathname = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(ROOT_DIR, safePathname));

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('접근할 수 없는 경로입니다.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = await fs.readFile(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60'
  });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'GET 요청만 지원합니다.' });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
      return;
    }

    await handleStatic(req, res, pathname);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: '파일을 찾을 수 없습니다.' });
      return;
    }

    sendJson(res, 500, {
      error: '서버 처리 중 오류가 발생했습니다.',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`MEDICost backend: http://localhost:${PORT}`);
});
