import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'steady-state.json');
const PORT = Number(process.env.PORT || process.env.STEADY_API_PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'steady_states';
const STEADY_USER_ID = process.env.STEADY_USER_ID || 'default';
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

async function readState() {
  if (useSupabase) return readSupabaseState();
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return null;
  }
}

async function writeState(state) {
  if (useSupabase) return writeSupabaseState(state);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify({ ...state, saved_at: new Date().toISOString() }, null, 2));
}

async function readSupabaseState() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(STEADY_USER_ID)}&select=state`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json();
  return rows[0]?.state || null;
}

async function writeSupabaseState(state) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: STEADY_USER_ID,
      state: { ...state, saved_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    })
  });
  if (!response.ok) throw new Error(`Supabase write failed: ${response.status} ${await response.text()}`);
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  };
}

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  if (req.url === '/api/health') return send(res, 200, { ok: true, storage: useSupabase ? `supabase:${SUPABASE_TABLE}:${STEADY_USER_ID}` : DATA_FILE });
  if (req.url === '/api/state' && req.method === 'GET') {
    try {
      return send(res, 200, { ok: true, state: await readState() });
    } catch (error) {
      return send(res, 500, { ok: false, error: error.message });
    }
  }
  if (req.url === '/api/state' && req.method === 'POST') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 5_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const state = JSON.parse(raw);
        await writeState(state);
        send(res, 200, { ok: true, saved_at: new Date().toISOString() });
      } catch (error) {
        send(res, 400, { ok: false, error: error.message });
      }
    });
    return undefined;
  }
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Steady backend storing data in ${useSupabase ? `Supabase table ${SUPABASE_TABLE}` : DATA_FILE}`);
  console.log(`Steady backend listening on http://${HOST}:${PORT}`);
});
