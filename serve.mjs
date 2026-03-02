import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';

const require = createRequire(import.meta.url);
const { Pool } = require('./node_modules/pg');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Load env vars from portal/.env
function loadEnv() {
  try {
    const content = fs.readFileSync(path.join(__dirname, 'portal', '.env'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const i = line.indexOf('=');
      if (i === -1 || line.trim().startsWith('#')) continue;
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
    }
    return env;
  } catch { return {}; }
}

const env = loadEnv();
const pool = new Pool({ connectionString: env.DIRECT_URL });

function genId() {
  return 'c' + randomBytes(12).toString('hex');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const method = req.method;

  // GET /api/crm/overview — aggregate stats + recent call activity
  if (urlPath === '/api/crm/overview' && method === 'GET') {
    try {
      const { rows: [stats] } = await pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM call_logs) AS calls,
          (SELECT COUNT(*)::int FROM appointments) AS appointments,
          (SELECT COUNT(*)::int FROM call_logs
           WHERE outcome IS NOT NULL AND outcome::text NOT IN ('no_answer','voicemail')) AS answered
      `);
      const rate = stats.calls > 0 ? Math.round(stats.answered / stats.calls * 100) : 0;
      const { rows: recent } = await pool.query(`
        SELECT cl.caller_name  AS "callerName",
               cl.caller_phone AS "callerPhone",
               cl.outcome,
               cl.timestamp,
               c.business_name AS "businessName"
        FROM call_logs cl
        JOIN clients c ON c.id = cl.client_id
        ORDER BY cl.timestamp DESC LIMIT 20
      `);
      return json(res, 200, { calls: stats.calls, appointments: stats.appointments, rate, recentCalls: recent });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // GET /api/crm/clients — list all clients with call/appt counts
  if (urlPath === '/api/crm/clients' && method === 'GET') {
    try {
      const { rows } = await pool.query(`
        SELECT c.id,
               c.business_name  AS "businessName",
               c.contact_name   AS "contactName",
               c.email, c.phone,
               c.industry, c.location, c.plan, c.status,
               c.created_at     AS "createdAt",
               (SELECT COUNT(*)::int FROM call_logs  cl WHERE cl.client_id = c.id) AS calls,
               (SELECT COUNT(*)::int FROM appointments a  WHERE a.client_id  = c.id) AS appointments
        FROM clients c ORDER BY c.created_at DESC
      `);
      return json(res, 200, rows);
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // POST /api/crm/clients — create new client
  if (urlPath === '/api/crm/clients' && method === 'POST') {
    try {
      const body = await readBody(req);
      const { businessName, contactName, email, phone, industry, location, plan, status } = body;
      if (!businessName || !contactName || !email)
        return json(res, 400, { error: 'businessName, contactName and email are required.' });
      const id = genId();
      const { rows } = await pool.query(
        `INSERT INTO clients (id, business_name, contact_name, email, phone, industry, location, plan, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
         RETURNING id, business_name AS "businessName", contact_name AS "contactName",
                   email, phone, industry, location, plan, status, created_at AS "createdAt"`,
        [id, businessName, contactName, email, phone||null, industry||null, location||null, plan||'STARTER', status||'INACTIVE']
      );
      return json(res, 201, rows[0]);
    } catch (e) {
      if (e.code === '23505') return json(res, 409, { error: 'A client with that email already exists.' });
      return json(res, 500, { error: e.message });
    }
  }

  // PATCH /api/crm/clients/:id — update status
  const patchMatch = urlPath.match(/^\/api\/crm\/clients\/([^/]+)$/);
  if (patchMatch && method === 'PATCH') {
    try {
      const id = patchMatch[1];
      const body = await readBody(req);
      if (!['ACTIVE','INACTIVE','SUSPENDED'].includes(body.status))
        return json(res, 400, { error: 'Invalid status.' });
      const { rows } = await pool.query(
        `UPDATE clients SET status=$1, updated_at=NOW() WHERE id=$2
         RETURNING id, business_name AS "businessName", contact_name AS "contactName",
                   email, phone, industry, location, plan, status, created_at AS "createdAt"`,
        [body.status, id]
      );
      if (!rows.length) return json(res, 404, { error: 'Client not found.' });
      return json(res, 200, rows[0]);
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // GET /api/crm/clients/:id/detail — client + call logs + appointments
  const detailMatch = urlPath.match(/^\/api\/crm\/clients\/([^/]+)\/detail$/);
  if (detailMatch && method === 'GET') {
    try {
      const id = detailMatch[1];
      const { rows: clients } = await pool.query(
        `SELECT id, business_name AS "businessName", contact_name AS "contactName",
                email, phone, industry, location, plan, status, created_at AS "createdAt"
         FROM clients WHERE id=$1`, [id]
      );
      if (!clients.length) return json(res, 404, { error: 'Client not found.' });
      const { rows: callLogs } = await pool.query(
        `SELECT id, caller_name AS "callerName", caller_phone AS "callerPhone",
                outcome, duration_seconds AS "durationSeconds", timestamp
         FROM call_logs WHERE client_id=$1 ORDER BY timestamp DESC LIMIT 20`, [id]
      );
      const { rows: appointments } = await pool.query(
        `SELECT id, caller_name AS "callerName", caller_phone AS "callerPhone",
                scheduled_at AS "scheduledAt", status,
                appointment_type AS "appointmentType"
         FROM appointments WHERE client_id=$1 ORDER BY scheduled_at ASC LIMIT 20`, [id]
      );
      return json(res, 200, { ...clients[0], callLogs, appointments });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // Static file server
  const filePath = path.join(__dirname, urlPath === '/' ? '/index.html' : urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serving on http://localhost:${PORT}`);
});
