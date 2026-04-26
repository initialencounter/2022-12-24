import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { executeRequest } from './encrypt';

const app = express();
const PORT = 3001;

// 缓存目录
const IMAGE_CACHE_DIR = path.join(process.cwd(), 'image-cache');
const RECORD_CACHE_DIR = path.join(process.cwd(), 'record-cache');
fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
fs.mkdirSync(RECORD_CACHE_DIR, { recursive: true });

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 静态资源缓存策略
const distDir = path.join(process.cwd(), 'dist');

// Vite 带 hash 的产物文件 — 永久缓存
app.use('/assets', express.static(path.join(distDir, 'assets'), {
  maxAge: '365d',
  immutable: true,
}));

// 公共静态资源（icon, theme, audio）— 7天缓存
for (const dir of ['icon', 'theme', 'audio']) {
  app.use(`/${dir}`, express.static(path.join(distDir, dir), {
    maxAge: '7d',
  }));
}

// 其余静态文件（index.html 等）— 不缓存，始终重新验证
app.use(express.static(distDir, {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

const apiPaths = [
  '/Minesweeper/post/list',
  '/Minesweeper/post/get',
  '/Minesweeper/post/comment/list',
  '/Minesweeper/post/list/search',
  '/Minesweeper/post/comment/list/reply',
  '/Minesweeper/post/list/good/user',
  '/Minesweeper/user/search',
  '/Minesweeper/minesweeper/record/list',
  '/Minesweeper/schulte/record/list/filter',
  '/Minesweeper/puzzle/record/list/filter',
  '/Minesweeper/tzfe/record/list/filter',
  '/Minesweeper/nono/record/list/filter',
  '/Minesweeper/user/config/get',
  '/Minesweeper/minesweeper/timing/career/simple',
  '/Minesweeper/sudoku/career',
  '/Minesweeper/puzzle/career/simple',
  '/Minesweeper/nono/career/simple',
  '/Minesweeper/tzfe/career',
  '/Minesweeper/schulte/career',
  '/Minesweeper/rank/timing/list',
  '/Minesweeper/rank/puzzle/list',
  '/Minesweeper/rank/schulte/list',
  '/Minesweeper/rank/tzfe/list',
  '/Minesweeper/rank/nono/list',
  '/Minesweeper/rank/all',
];

apiPaths.forEach(path => {
  app.all(path, async (req, res) => {
    try {
      if (req.method !== 'POST') {
        req.body = new URLSearchParams(req.query as Record<string, string>);
      }
      const data = await executeRequest(path, 'POST', req.body);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
});

app.post('/Minesweeper/user/home', async (req, res) => {
  try {
    const data: any = await executeRequest('/Minesweeper/user/home', 'POST', req.body);
    delete data.data.user.mail; // 删除敏感字段
    delete data.data.user.password;
    delete data.data.user.phone;
    delete data.data.user.registerIp;
    delete data.data.user.token;
    delete data.data.user.userId;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ======== 图片代理缓存 ========
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // SSRF 防护：只允许 http/https
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http/https URLs are allowed' });
  }

  const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
  // 检查缓存目录中是否存在以此 hash 为前缀的文件
  const cachedFiles = fs.readdirSync(IMAGE_CACHE_DIR).filter(f => f.startsWith(hash));

  if (cachedFiles.length > 0) {
    const cachedFile = path.join(IMAGE_CACHE_DIR, cachedFiles[0]);
    const ext = path.extname(cachedFiles[0]).slice(1);
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(cachedFile);
  }

  try {
    const controller = new AbortController();
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_SIZE) {
      controller.abort();
      return res.status(413).json({ error: 'Image too large' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_SIZE) {
      return res.status(413).json({ error: 'Image too large' });
    }

    // 根据 Content-Type 确定扩展名
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
      'image/webp': 'webp', 'image/svg+xml': 'svg',
    };
    const ext = extMap[contentType.split(';')[0].trim()] || 'bin';
    const cacheFile = path.join(IMAGE_CACHE_DIR, `${hash}.${ext}`);
    fs.writeFileSync(cacheFile, buffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch image: ' + String(err) });
  }
});

// ======== 录像 API 缓存（不可变数据，永久缓存） ========
const recordPaths: Record<string, string> = {
  '/Minesweeper/minesweeper/record/get': 'minesweeper',
  '/Minesweeper/puzzle/record/get': 'puzzle',
  '/Minesweeper/schulte/record/get': 'schulte',
};

for (const [apiPath, recordType] of Object.entries(recordPaths)) {
  app.post(apiPath, async (req, res) => {
    console.log(`Received request for ${recordType} record:`, req.body);
    const recordId = req.body.recordId;
    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId' });
    }

    const cacheKey = `${recordType}-${recordId}.json`;
    const cacheFile = path.join(RECORD_CACHE_DIR, cacheKey);

    // 检查服务端缓存
    if (fs.existsSync(cacheFile)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(cacheFile);
    }

    try {
      const data = await executeRequest(apiPath, 'POST', req.body);
      // 只缓存成功的响应
      if ((data as any).code === 200) {
        fs.writeFileSync(cacheFile, JSON.stringify(data));
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
}


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 处理前端的路由 (SPA 支持)
app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
});
