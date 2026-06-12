// Family Chores — tiny zero-dependency Node server.
// Run with:  node server.js   (data is stored in data.json next to this file)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const APP_VERSION = 'v3'; // bump on every release — shown in the dashboard footer

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- data ----------

function defaultData() {
  return {
    settings: { adminPin: '12345', currency: 'R', dailyStartHour: 0, language: 'en' },
    children: [
      { id: 'luan', name: 'Luan', emoji: '🦁', color: '#FF9F43', pin: '1111', birthday: '2019-09-09' },
      { id: 'arno', name: 'Arno', emoji: '🐻', color: '#54A0FF', pin: '2222', birthday: '2021-10-04' },
    ],
    chores: [
      { id: newId(), name: 'Make your bed', emoji: '🛏️', value: 5, assignedTo: 'each', frequency: 'daily', active: true, enabled: true },
      { id: newId(), name: 'Tidy up your toys', emoji: '🧸', value: 5, assignedTo: 'each', frequency: 'daily', active: true, enabled: true },
      { id: newId(), name: 'Pack the dishwasher', emoji: '🍽️', value: 5, assignedTo: 'luan', frequency: 'daily', active: true, enabled: true },
      { id: newId(), name: 'Take dishes to the kitchen', emoji: '🥣', value: 3, assignedTo: 'arno', frequency: 'daily', active: true, enabled: true },
      { id: newId(), name: 'Sweep the pool', emoji: '🏊', value: 20, assignedTo: 'any', frequency: 'weekly', active: true, enabled: true },
    ],
    completions: [], // {id, choreId, choreName, choreEmoji, childId, value, at}
    payouts: [],     // {id, childId, amount, at}
  };
}

function newId() {
  return crypto.randomBytes(6).toString('hex');
}

let data;
function loadData() {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    data = defaultData();
    saveData();
  }
  // fill in birthdays for data files created before the birthday feature
  const knownBirthdays = { luan: '2019-09-09', arno: '2021-10-04' };
  let patched = false;
  for (const child of data.children) {
    if (!child.birthday && knownBirthdays[child.id]) {
      child.birthday = knownBirthdays[child.id];
      patched = true;
    }
  }
  if (patched) saveData();
}

function saveData() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// ---------- date helpers (server-local time) ----------

function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function daysBetween(a, b) {
  const sa = new Date(a); sa.setHours(0, 0, 0, 0);
  const sb = new Date(b); sb.setHours(0, 0, 0, 0);
  return Math.round((sb - sa) / 86400000);
}

// ---------- chore availability ----------

// A chore is available to a child if it's assigned to them (directly, or via
// 'each'/'any') and hasn't been done yet within its frequency window.
// 'each'  -> every assigned child has their own instance.
// 'any'   -> first child to do it claims it for the whole window.
function isAvailable(chore, childId, now) {
  if (!chore.active || chore.enabled === false) return false;
  if (chore.assignedTo !== 'any' && chore.assignedTo !== 'each' && chore.assignedTo !== childId) return false;

  const done = data.completions.filter(c =>
    c.choreId === chore.id && (chore.assignedTo === 'each' ? c.childId === childId : true)
  );
  const startHour = data.settings.dailyStartHour || 0;

  if (chore.frequency === 'once') return done.length === 0;
  if (chore.frequency === 'daily') {
    // fresh every day: appears at startHour, expires at midnight
    if (now.getHours() < startHour) return false;
    return !done.some(c => dayKey(new Date(c.at)) === dayKey(now));
  }
  if (chore.frequency === 'weekly' || chore.frequency === 'custom') {
    // cooldown counted from the most recent completion; once it reappears
    // it stays available until done (no expiry)
    const cooldownDays = chore.frequency === 'weekly' ? 7 : chore.everyDays;
    const last = done.map(c => new Date(c.at)).sort((a, b) => b - a)[0];
    if (!last) return true;
    const days = daysBetween(last, now);
    if (days < cooldownDays) return false;
    if (days === cooldownDays && now.getHours() < startHour) return false; // reappears today, at startHour
    return true;
  }
  return false;
}

function availableChoresFor(childId, now) {
  return data.chores.filter(ch => isAvailable(ch, childId, now));
}

function childTotals(childId) {
  const earned = data.completions.filter(c => c.childId === childId).reduce((s, c) => s + c.value, 0);
  const paidOut = data.payouts.filter(p => p.childId === childId).reduce((s, p) => s + p.amount, 0);
  return { earned, paidOut, balance: earned - paidOut };
}

// ---------- API ----------

function isBirthdayToday(birthday, now) {
  if (!birthday) return false;
  const [, m, d] = birthday.split('-').map(Number);
  return now.getMonth() + 1 === m && now.getDate() === d;
}

function publicState() {
  const now = new Date();
  return {
    version: APP_VERSION,
    currency: data.settings.currency,
    language: data.settings.language || 'en',
    children: data.children.map(ch => ({
      id: ch.id,
      name: ch.name,
      emoji: ch.emoji,
      color: ch.color,
      isBirthday: isBirthdayToday(ch.birthday, now),
      age: ch.birthday ? now.getFullYear() - Number(ch.birthday.split('-')[0]) : null,
      ...childTotals(ch.id),
      availableCount: availableChoresFor(ch.id, now).length,
      doneToday: data.completions
        .filter(c => c.childId === ch.id && dayKey(new Date(c.at)) === dayKey(now))
        .map(c => ({ name: c.choreName, emoji: c.choreEmoji, value: c.value })),
    })),
  };
}

function isAdmin(req) {
  return req.headers['x-admin-pin'] === data.settings.adminPin;
}

const routes = {
  'GET /api/state': () => ({ status: 200, body: publicState() }),

  'GET /api/chores': (req, q) => {
    const child = data.children.find(c => c.id === q.childId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    const now = new Date();
    return {
      status: 200,
      body: {
        currency: data.settings.currency,
        chores: availableChoresFor(child.id, now).map(ch => ({
          id: ch.id, name: ch.name, emoji: ch.emoji, value: ch.value, frequency: ch.frequency, everyDays: ch.everyDays, assignedTo: ch.assignedTo,
        })),
      },
    };
  },

  'POST /api/complete': (req, q, body) => {
    const child = data.children.find(c => c.id === body.childId);
    const chore = data.chores.find(c => c.id === body.choreId);
    if (!child || !chore) return { status: 404, body: { error: 'Not found' } };
    if (child.pin !== String(body.pin)) return { status: 403, body: { error: 'wrong-pin' } };
    if (!isAvailable(chore, child.id, new Date())) {
      return { status: 409, body: { error: 'already-done' } };
    }
    data.completions.push({
      id: newId(),
      choreId: chore.id,
      choreName: chore.name,
      choreEmoji: chore.emoji,
      childId: child.id,
      value: chore.value,
      at: new Date().toISOString(),
    });
    saveData();
    return { status: 200, body: { ok: true, value: chore.value, balance: childTotals(child.id).balance } };
  },

  'POST /api/child/verify': (req, q, body) => {
    const child = data.children.find(c => c.id === body.childId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    if (child.pin !== String(body.pin)) return { status: 403, body: { error: 'wrong-pin' } };
    return { status: 200, body: { ok: true } };
  },

  'POST /api/child/avatar': (req, q, body) => {
    const child = data.children.find(c => c.id === body.childId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    if (child.pin !== String(body.pin)) return { status: 403, body: { error: 'wrong-pin' } };
    const emoji = String(body.emoji || '').trim();
    if (!emoji || emoji.length > 8) return { status: 400, body: { error: 'Pick a valid avatar' } };
    child.emoji = emoji;
    saveData();
    return { status: 200, body: { ok: true, emoji } };
  },

  'POST /api/admin/login': (req, q, body) => {
    if (String(body.pin) !== data.settings.adminPin) return { status: 403, body: { error: 'wrong-pin' } };
    return { status: 200, body: { ok: true } };
  },

  'GET /api/admin/overview': (req) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    return {
      status: 200,
      body: {
        settings: { currency: data.settings.currency, dailyStartHour: data.settings.dailyStartHour || 0, language: data.settings.language || 'en' },
        children: data.children.map(c => ({ id: c.id, name: c.name, emoji: c.emoji, pin: c.pin, birthday: c.birthday || '', ...childTotals(c.id) })),
        chores: data.chores.filter(c => c.active),
        history: [
          ...data.completions.map(c => ({ kind: 'completion', id: c.id, childId: c.childId, label: `${c.choreEmoji} ${c.choreName}`, amount: c.value, at: c.at })),
          ...data.payouts.map(p => ({ kind: 'payout', id: p.id, childId: p.childId, label: '💰 Pay day', amount: -p.amount, at: p.at })),
        ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100),
      },
    };
  },

  'POST /api/admin/chores': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    const err = validateChore(body);
    if (err) return { status: 400, body: { error: err } };
    data.chores.push({
      id: newId(),
      name: String(body.name).trim(),
      emoji: body.emoji || '⭐',
      value: Number(body.value),
      assignedTo: body.assignedTo,
      frequency: body.frequency,
      everyDays: body.frequency === 'custom' ? Number(body.everyDays) : undefined,
      active: true,
      enabled: true,
    });
    saveData();
    return { status: 200, body: { ok: true } };
  },

  'PUT /api/admin/chores': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    const chore = data.chores.find(c => c.id === body.id);
    if (!chore) return { status: 404, body: { error: 'Not found' } };
    const err = validateChore(body);
    if (err) return { status: 400, body: { error: err } };
    Object.assign(chore, {
      name: String(body.name).trim(),
      emoji: body.emoji || '⭐',
      value: Number(body.value),
      assignedTo: body.assignedTo,
      frequency: body.frequency,
      everyDays: body.frequency === 'custom' ? Number(body.everyDays) : undefined,
    });
    saveData();
    return { status: 200, body: { ok: true } };
  },

  'POST /api/admin/chores/toggle': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    const chore = data.chores.find(c => c.id === body.id);
    if (!chore) return { status: 404, body: { error: 'Not found' } };
    chore.enabled = !!body.enabled;
    saveData();
    return { status: 200, body: { ok: true } };
  },

  'DELETE /api/admin/chores': (req, q) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    const chore = data.chores.find(c => c.id === q.id);
    if (!chore) return { status: 404, body: { error: 'Not found' } };
    chore.active = false; // keep it so history still makes sense
    saveData();
    return { status: 200, body: { ok: true } };
  },

  'POST /api/admin/payout': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    const child = data.children.find(c => c.id === body.childId);
    const amount = Number(body.amount);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    if (!Number.isFinite(amount) || amount <= 0) return { status: 400, body: { error: 'Amount must be more than 0' } };
    data.payouts.push({ id: newId(), childId: child.id, amount, at: new Date().toISOString() });
    saveData();
    return { status: 200, body: { ok: true, balance: childTotals(child.id).balance } };
  },

  'POST /api/admin/undo': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    if (body.kind === 'completion') data.completions = data.completions.filter(c => c.id !== body.id);
    else if (body.kind === 'payout') data.payouts = data.payouts.filter(p => p.id !== body.id);
    else return { status: 400, body: { error: 'Unknown kind' } };
    saveData();
    return { status: 200, body: { ok: true } };
  },

  'POST /api/admin/settings': (req, q, body) => {
    if (!isAdmin(req)) return { status: 403, body: { error: 'forbidden' } };
    if (body.currency !== undefined) {
      const cur = String(body.currency).trim();
      if (!cur || cur.length > 3) return { status: 400, body: { error: 'Currency must be 1-3 characters' } };
      data.settings.currency = cur;
    }
    if (body.childBirthdays) {
      for (const [childId, birthday] of Object.entries(body.childBirthdays)) {
        const b = String(birthday).trim();
        if (b && (!/^\d{4}-\d{2}-\d{2}$/.test(b) || isNaN(new Date(b).getTime()))) {
          return { status: 400, body: { error: 'Birthdays must be valid dates' } };
        }
        const child = data.children.find(c => c.id === childId);
        if (child) child.birthday = b;
      }
    }
    if (body.language !== undefined) {
      if (!['en', 'af'].includes(body.language)) return { status: 400, body: { error: 'Unknown language' } };
      data.settings.language = body.language;
    }
    if (body.dailyStartHour !== undefined) {
      const h = Number(body.dailyStartHour);
      if (!Number.isInteger(h) || h < 0 || h > 23) return { status: 400, body: { error: 'Start hour must be 0-23' } };
      data.settings.dailyStartHour = h;
    }
    if (body.adminPin !== undefined) {
      if (!/^\d{5}$/.test(String(body.adminPin))) return { status: 400, body: { error: 'Parent PIN must be exactly 5 digits' } };
      data.settings.adminPin = String(body.adminPin);
    }
    if (body.childEmojis) {
      for (const [childId, emoji] of Object.entries(body.childEmojis)) {
        const e = String(emoji).trim();
        if (!e || e.length > 8) return { status: 400, body: { error: 'Pick a valid avatar' } };
        const child = data.children.find(c => c.id === childId);
        if (child) child.emoji = e;
      }
    }
    if (body.childPins) {
      for (const [childId, pin] of Object.entries(body.childPins)) {
        if (!/^\d{4}$/.test(String(pin))) return { status: 400, body: { error: 'Child codes must be exactly 4 digits' } };
        const child = data.children.find(c => c.id === childId);
        if (child) child.pin = String(pin);
      }
      const pins = data.children.map(c => c.pin);
      if (new Set(pins).size !== pins.length) return { status: 400, body: { error: 'Each child needs a different code' } };
    }
    saveData();
    return { status: 200, body: { ok: true } };
  },
};

function validateChore(body) {
  if (!body.name || !String(body.name).trim()) return 'Chore needs a name';
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return 'Value must be more than 0';
  const validAssignees = ['any', 'each', ...data.children.map(c => c.id)];
  if (!validAssignees.includes(body.assignedTo)) return 'Pick who can do it';
  if (!['daily', 'weekly', 'once', 'custom'].includes(body.frequency)) return 'Pick a frequency';
  if (body.frequency === 'custom') {
    const n = Number(body.everyDays);
    if (!Number.isInteger(n) || n < 2 || n > 365) return 'Custom days must be a whole number from 2 to 365';
  }
  return null;
}

// ---------- server plumbing ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
      const handler = routes[req.method + ' ' + url.pathname];
      const result = handler
        ? handler(req, Object.fromEntries(url.searchParams), body)
        : { status: 404, body: { error: 'Not found' } };
      res.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result.body));
    });
    return;
  }

  // static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(PUBLIC_DIR, path.normalize(filePath).replace(/^([.][.][/\\])+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end(); return; }
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    // no-cache: browsers (and the HA companion app's WebView) must check with
    // the server on every load instead of serving a stale copy for days
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  });
});

loadData();
server.listen(PORT, () => {
  console.log(`Family Chores running at http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
