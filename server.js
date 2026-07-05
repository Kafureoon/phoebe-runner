const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 5175);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const MAX_BODY = 16 * 1024;
const MAX_ENTRIES = 200;
const RUN_SESSION_TTL = 2 * 60 * 60 * 1000;
const MIN_RUN_MS = 900;
const SCORE_DISTANCE_UNIT = 10.5;
const SPEED_BASE = 345;
const SPEED_STEP_SCORE = 500;
const SPEED_STEP_GAIN = 55;
const SPEED_MAX = 840;
const SCORE_MARGIN = 120;
const BONUS_PER_SECOND_ALLOWANCE = 28;

const runSessions = new Map();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

function readLeaderboard() {
  ensureStore();
  try {
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return normalizeLeaderboardEntries(entries);
  } catch {
    return [];
  }
}

function writeLeaderboard(entries) {
  const safe = normalizeLeaderboardEntries(entries);
  ensureStore();
  const tmp = `${LEADERBOARD_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ entries: safe }, null, 2));
  fs.renameSync(tmp, LEADERBOARD_FILE);
  return safe;
}

function normalizeLeaderboardEntries(entries) {
  const bestByName = new Map();
  for (const raw of entries || []) {
    if (!raw) continue;
    const entry = {
      id: String(raw.id || crypto.randomUUID()),
      name: sanitizeName(raw.name),
      score: normalizeScore(raw.score),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    };
    if (entry.score <= 0) continue;
    const key = nameKey(entry.name);
    const previous = bestByName.get(key);
    if (
      !previous ||
      entry.score > previous.score ||
      (entry.score === previous.score && new Date(entry.createdAt) < new Date(previous.createdAt))
    ) {
      bestByName.set(key, entry);
    }
  }
  return Array.from(bestByName.values())
    .sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, MAX_ENTRIES);
}

function sanitizeName(value) {
  const text = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (text || '菲比玩家').slice(0, 18);
}

function nameKey(value) {
  return sanitizeName(value).toLocaleLowerCase('zh-CN');
}

function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(99999999, Math.floor(number)));
}

function normalizeMetric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.floor(number));
}

function speedLevel(score) {
  return Math.floor(Math.max(0, score) / SPEED_STEP_SCORE);
}

function speedForScore(score) {
  return Math.min(SPEED_MAX, SPEED_BASE + speedLevel(score) * SPEED_STEP_GAIN);
}

function maxPlausibleScore(elapsedMs) {
  let remaining = Math.max(0, elapsedMs) / 1000;
  let distance = 0;
  let score = 0;
  while (remaining > 0) {
    const step = Math.min(0.25, remaining);
    distance += speedForScore(score) * step;
    score = Math.floor(distance / SCORE_DISTANCE_UNIT);
    remaining -= step;
  }
  const bonusAllowance = Math.ceil((elapsedMs / 1000) * BONUS_PER_SECOND_ALLOWANCE + SCORE_MARGIN);
  return score + bonusAllowance;
}

function cleanupRunSessions(now = Date.now()) {
  for (const [id, session] of runSessions) {
    const ttl = session.submittedAt ? 60 * 1000 : RUN_SESSION_TTL;
    if (now - session.startedAt > ttl) runSessions.delete(id);
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function safeEqualHash(a, b) {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateRunSubmission(body, score) {
  cleanupRunSessions();
  const runId = String(body.runId || '');
  const token = String(body.token || body.runToken || '');
  const session = runSessions.get(runId);
  if (!session || !token || !safeEqualHash(hashToken(token), session.tokenHash)) {
    return { ok: false, error: 'run_session_required' };
  }
  if (session.submittedAt) return { ok: false, error: 'run_already_submitted' };

  const now = Date.now();
  const serverElapsedMs = Math.max(0, now - session.startedAt);
  const clientElapsedMs = normalizeMetric(body.elapsedMs);
  if (clientElapsedMs !== null && clientElapsedMs > serverElapsedMs + 8000) {
    return { ok: false, error: 'bad_run_time' };
  }

  const elapsedMs = clientElapsedMs === null ? serverElapsedMs : Math.min(serverElapsedMs, clientElapsedMs);
  if (elapsedMs < MIN_RUN_MS && score > 35) return { ok: false, error: 'run_too_short' };
  if (score > maxPlausibleScore(elapsedMs)) return { ok: false, error: 'score_too_fast' };

  const distance = normalizeMetric(body.distance);
  const bonus = normalizeMetric(body.bonus);
  if (distance !== null && bonus !== null) {
    const telemetryScore = Math.floor(distance / SCORE_DISTANCE_UNIT) + bonus;
    if (Math.abs(telemetryScore - score) > 4) return { ok: false, error: 'score_mismatch' };
    const bonusLimit = Math.ceil((elapsedMs / 1000) * BONUS_PER_SECOND_ALLOWANCE + SCORE_MARGIN);
    if (bonus > bonusLimit) return { ok: false, error: 'bonus_too_high' };
  }

  const speed = normalizeMetric(body.speed);
  if (speed !== null && speed > speedForScore(score) + SPEED_STEP_GAIN + 20) {
    return { ok: false, error: 'speed_too_high' };
  }

  return { ok: true, session };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

function handleRunStart(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { allow: 'POST' });
    res.end('Method Not Allowed');
    return;
  }

  cleanupRunSessions();
  const runId = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('base64url');
  const startedAt = Date.now();
  runSessions.set(runId, {
    tokenHash: hashToken(token),
    startedAt,
    submittedAt: 0,
  });
  return json(res, 201, {
    ok: true,
    runId,
    token,
    startedAt: new Date(startedAt).toISOString(),
  });
}

function handleLeaderboard(req, res, url) {
  if (req.method === 'GET') {
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 20) || 20));
    return json(res, 200, { ok: true, entries: readLeaderboard().slice(0, limit) });
  }

  if (req.method === 'POST') {
    return readJsonBody(req)
      .then((body) => {
        const score = normalizeScore(body.score);
        if (score <= 0) return json(res, 400, { ok: false, error: 'score_required' });
        const runCheck = validateRunSubmission(body, score);
        if (!runCheck.ok) return json(res, 403, { ok: false, error: runCheck.error });
        const name = sanitizeName(body.name);
        const key = nameKey(name);
        const currentEntries = readLeaderboard();
        const existing = currentEntries.find((item) => nameKey(item.name) === key);
        let entry;
        let improved = false;

        if (existing && score <= existing.score) {
          entry = existing;
        } else {
          improved = true;
          entry = {
            id: existing?.id || crypto.randomUUID(),
            name,
            score,
            createdAt: new Date().toISOString(),
          };
        }

        const withoutSameName = currentEntries.filter((item) => nameKey(item.name) !== key);
        const entries = writeLeaderboard([entry, ...withoutSameName]);
        runCheck.session.submittedAt = Date.now();
        const rank = entries.findIndex((item) => nameKey(item.name) === key) + 1;
        return json(res, improved ? 201 : 200, {
          ok: true,
          entry,
          rank: rank || null,
          improved,
          personalBest: entry.score,
          entries: entries.slice(0, 20),
        });
      })
      .catch((error) => json(res, error.message === 'body_too_large' ? 413 : 400, { ok: false, error: error.message }));
  }

  res.writeHead(405, { allow: 'GET, POST' });
  res.end('Method Not Allowed');
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  const allowed =
    pathname === '/index.html' ||
    pathname === '/styles.css' ||
    pathname === '/game.js' ||
    pathname.startsWith('/assets/');
  if (!allowed || pathname.split('/').some((segment) => segment.startsWith('.'))) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': mime[ext] || 'application/octet-stream',
      'cache-control': ['.html', '.css', '.js'].includes(ext) ? 'no-store, no-cache, must-revalidate' : 'public, max-age=3600',
      'content-length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
  if (url.pathname === '/api/run/start') return handleRunStart(req, res);
  if (url.pathname === '/api/leaderboard') return handleLeaderboard(req, res, url);
  return serveStatic(req, res, url);
});

ensureStore();
server.listen(PORT, HOST, () => {
  console.log(`Phoebe Runner listening on http://${HOST}:${PORT}`);
});
