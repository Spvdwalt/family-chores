// ===== Family Chores front-end =====

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

let state = null;            // dashboard state from /api/state
let currentChild = null;     // child whose chore list is open
let adminPin = sessionStorage.getItem('adminPin') || null;

const EMOJIS = ['⭐','🛏️','🧸','🧹','🍽️','🥣','🐕','🐈','🌿','🏊','🗑️','👕','📚','🧺','🪥','⚽','🚿','🧽','🥕','🚗','🛒','🧦','🪟','🍞'];
const AVATARS = ['🦁','🐻','🐯','🦊','🐵','🐶','🐱','🐼','🐨','🦖','🦄','🐸','🐧','🦅','🐬','🚀','⚽','🌟'];
const CHORE_IDEAS = [
  { name: 'Pack the dishwasher', emoji: '🍽️', value: 5, frequency: 'daily' },
  { name: 'Take dishes to the kitchen', emoji: '🥣', value: 3, frequency: 'daily' },
  { name: 'Make your bed', emoji: '🛏️', value: 5, frequency: 'daily' },
  { name: 'Tidy up your toys', emoji: '🧸', value: 5, frequency: 'daily' },
  { name: 'Take out the rubbish', emoji: '🗑️', value: 5, frequency: 'daily' },
  { name: 'Feed the pets', emoji: '🐕', value: 5, frequency: 'daily' },
  { name: 'Dirty clothes in the basket', emoji: '👕', value: 3, frequency: 'daily' },
  { name: 'Help fold the washing', emoji: '🧺', value: 8, frequency: 'weekly' },
  { name: 'Water the plants', emoji: '🌿', value: 5, frequency: 'weekly' },
  { name: 'Sweep the pool', emoji: '🏊', value: 20, frequency: 'weekly' },
  { name: 'Help wash the car', emoji: '🚗', value: 15, frequency: 'weekly' },
  { name: 'Sweep the kitchen floor', emoji: '🧹', value: 8, frequency: 'daily' },
  { name: 'Wipe the table after dinner', emoji: '🪟', value: 3, frequency: 'daily' },
  { name: 'Pack away your school bag', emoji: '📚', value: 3, frequency: 'daily' },
  { name: 'Help unpack the groceries', emoji: '🛒', value: 5, frequency: 'weekly' },
  { name: 'Match the socks', emoji: '🧦', value: 5, frequency: 'weekly' },
  { name: 'Brush teeth without being asked', emoji: '🪥', value: 2, frequency: 'daily' },
  { name: 'Hang up your towel', emoji: '🚿', value: 2, frequency: 'daily' },
  { name: 'Pack away outside toys', emoji: '⚽', value: 5, frequency: 'daily' },
  { name: 'Help make breakfast', emoji: '🍞', value: 5, frequency: 'weekly' },
];
const FREQ_LABEL = { daily: 'Every day', weekly: 'Once a week', once: 'Once-off' };
function freqLabel(ch) {
  return ch.frequency === 'custom' ? `Every ${ch.everyDays} days` : FREQ_LABEL[ch.frequency];
}

// ---------- tiny helpers ----------

function money(n) {
  const cur = state ? state.currency : 'R';
  return `${cur}${Number(n).toLocaleString()}`;
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(adminPin ? { 'x-admin-pin': adminPin } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'Something went wrong'), { code: json.error, status: res.status });
  return json;
}

function show(viewId) {
  $$('.view').forEach(v => v.classList.toggle('hidden', v.id !== viewId));
  window.scrollTo(0, 0);
}

let toastTimer;
function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

// ---------- PIN pad ----------

const pinPad = (() => {
  let buf = '', length = 4, onDone = null;

  function open({ title, avatar, digits, handler }) {
    buf = ''; length = digits; onDone = handler;
    $('#pin-title').textContent = title;
    $('#pin-avatar').textContent = avatar || '🔒';
    renderDots();
    $('#pin-overlay').classList.remove('hidden');
  }
  function close() { $('#pin-overlay').classList.add('hidden'); }
  function renderDots() {
    $('#pin-dots').innerHTML = Array.from({ length }, (_, i) =>
      `<div class="pin-dot ${i < buf.length ? 'filled' : ''}"></div>`).join('');
  }
  function wrong() {
    const dots = $('#pin-dots');
    dots.classList.add('shake');
    setTimeout(() => { dots.classList.remove('shake'); buf = ''; renderDots(); }, 450);
  }

  $('.keypad').addEventListener('click', async e => {
    const key = e.target.dataset?.key;
    if (!key) return;
    if (key === 'cancel') { close(); return; }
    if (key === 'back') { buf = buf.slice(0, -1); renderDots(); return; }
    if (buf.length >= length) return;
    buf += key;
    renderDots();
    if (buf.length === length) {
      const entered = buf;
      const ok = await onDone(entered);
      if (ok) close(); else wrong();
    }
  });

  return { open, close };
})();

// ---------- celebration ----------

function celebrate(childName, value) {
  $('#celebrate-emoji').textContent = ['🎉','🌟','🏆','🥳','💪'][Math.floor(Math.random() * 5)];
  $('#celebrate-text').textContent = `Well done, ${childName}!`;
  $('#celebrate-sub').textContent = `You earned ${money(value)}!`;
  $('#celebrate').classList.remove('hidden');

  const layer = $('#confetti-layer');
  const colors = ['#FF9F43', '#54A0FF', '#2ecc71', '#ff6b6b', '#feca57', '#6c5ce7'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    layer.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
  setTimeout(() => $('#celebrate').classList.add('hidden'), 2300);
}
$('#celebrate').addEventListener('click', () => $('#celebrate').classList.add('hidden'));

// ---------- dashboard ----------

async function loadDashboard() {
  state = await api('GET', '/api/state');
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  $('#today-line').textContent = today;

  $('#child-cards').innerHTML = state.children.map(ch => {
    const banner = ch.availableCount > 0
      ? `<span class="chore-banner">✨ ${ch.availableCount} chore${ch.availableCount > 1 ? 's' : ''} waiting!</span>`
      : `<span class="chore-banner all-done">🎉 All done!</span>`;
    return `
      <button class="child-card" data-child="${ch.id}" style="--child-color:${ch.color}">
        <div class="child-top">
          <div class="child-avatar">${ch.emoji}</div>
          <div>
            <div class="child-name">${ch.name}</div>
            ${banner}
          </div>
        </div>
        <div class="child-stats">
          <div class="stat pocket"><div class="num">${money(ch.balance)}</div><div class="lbl">Pocket</div></div>
          <div class="stat"><div class="num">${money(ch.earned)}</div><div class="lbl">Earned</div></div>
          <div class="stat"><div class="num">${money(ch.paidOut)}</div><div class="lbl">Paid out</div></div>
        </div>
      </button>`;
  }).join('');

  $$('#child-cards .child-card').forEach(card =>
    card.addEventListener('click', () => openChild(card.dataset.child)));
}

// ---------- child chore list ----------

async function openChild(childId) {
  currentChild = state.children.find(c => c.id === childId);
  if (!currentChild) return;
  $('#chores-title').textContent = `${currentChild.emoji} ${currentChild.name}'s chores`;
  $('#btn-avatar').textContent = currentChild.emoji;
  const { chores } = await api('GET', `/api/chores?childId=${childId}`);

  if (chores.length === 0) {
    $('#chore-list').innerHTML = `
      <div class="empty-state">
        <div class="big">🎉</div>
        <p><strong>All done for now!</strong></p>
        <p>Check back later for more chores.</p>
      </div>`;
  } else {
    $('#chore-list').innerHTML = chores.map(ch => `
      <button class="chore-card" data-chore="${ch.id}">
        <div class="chore-emoji">${ch.emoji}</div>
        <div class="chore-info">
          <div class="chore-name">${ch.name}</div>
          <div class="chore-meta">${freqLabel(ch)}${ch.assignedTo === 'any' ? ' · first one wins!' : ''}</div>
        </div>
        <div class="chore-value">+${money(ch.value)}</div>
      </button>`).join('');
    $$('#chore-list .chore-card').forEach(card =>
      card.addEventListener('click', () => tryComplete(card.dataset.chore)));
  }

  const done = currentChild.doneToday;
  $('#done-today').classList.toggle('hidden', done.length === 0);
  $('#done-list').innerHTML = done.map(d => `
    <div class="done-item"><span class="tick">✓</span> ${d.emoji} ${d.name} <span class="val">+${money(d.value)}</span></div>`).join('');

  show('view-chores');
}

function tryComplete(choreId) {
  pinPad.open({
    title: `${currentChild.name}, enter your secret code`,
    avatar: currentChild.emoji,
    digits: 4,
    handler: async pin => {
      try {
        const res = await api('POST', '/api/complete', { choreId, childId: currentChild.id, pin });
        celebrate(currentChild.name, res.value);
        await loadDashboard();
        show('view-dashboard');
        return true;
      } catch (err) {
        if (err.code === 'wrong-pin') return false;
        if (err.code === 'already-done') {
          toast('Oops — that one was just done!', 'error');
          await loadDashboard();
          await openChild(currentChild.id);
          return true;
        }
        toast(err.message, 'error');
        return true;
      }
    },
  });
}

// ---------- child avatar picker ----------

$('#btn-avatar').addEventListener('click', () => {
  if (!currentChild) return;
  $('#avatar-grid').innerHTML = AVATARS.map(a =>
    `<button type="button" data-pick="${a}" class="${currentChild.emoji === a ? 'selected' : ''}">${a}</button>`).join('');
  $$('#avatar-grid [data-pick]').forEach(b => b.addEventListener('click', () => {
    const chosen = b.dataset.pick;
    $('#avatar-overlay').classList.add('hidden');
    if (chosen === currentChild.emoji) return;
    pinPad.open({
      title: `${currentChild.name}, enter your secret code`,
      avatar: chosen,
      digits: 4,
      handler: async pin => {
        try {
          await api('POST', '/api/child/avatar', { childId: currentChild.id, pin, emoji: chosen });
          currentChild.emoji = chosen;
          $('#chores-title').textContent = `${currentChild.emoji} ${currentChild.name}'s chores`;
          $('#btn-avatar').textContent = currentChild.emoji;
          $('#pin-avatar').textContent = currentChild.emoji;
          toast(`Looking good, ${currentChild.name}! ${chosen}`, 'success');
          state = await api('GET', '/api/state');
          return true;
        } catch (err) {
          if (err.code === 'wrong-pin') return false;
          toast(err.message, 'error');
          return true;
        }
      },
    });
  }));
  $('#avatar-overlay').classList.remove('hidden');
});
$('#avatar-cancel').addEventListener('click', () => $('#avatar-overlay').classList.add('hidden'));

// ---------- admin ----------

$('#btn-admin').addEventListener('click', () => {
  if (adminPin) { openAdmin(); return; }
  pinPad.open({
    title: 'Parents only — enter PIN',
    avatar: '🔒',
    digits: 5,
    handler: async pin => {
      try {
        await api('POST', '/api/admin/login', { pin });
        adminPin = pin;
        sessionStorage.setItem('adminPin', pin);
        openAdmin();
        return true;
      } catch { return false; }
    },
  });
});

let admin = null; // overview payload

async function openAdmin() {
  try {
    admin = await api('GET', '/api/admin/overview');
  } catch {
    adminPin = null; sessionStorage.removeItem('adminPin');
    $('#btn-admin').click();
    return;
  }
  renderAdminChores();
  renderPayday();
  renderHistory();
  renderSettings();
  show('view-admin');
}

$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
  $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab.dataset.tab));
}));

function assigneeLabel(assignedTo) {
  if (assignedTo === 'each') return 'Both (own chore each)';
  if (assignedTo === 'any') return 'Anyone (first one wins)';
  const ch = admin.children.find(c => c.id === assignedTo);
  return ch ? `Only ${ch.name}` : assignedTo;
}

// --- chores tab ---

function renderAdminChores() {
  $('#admin-chore-list').innerHTML = admin.chores.map(ch => `
    <div class="admin-chore ${ch.enabled === false ? 'off' : ''}">
      <div class="chore-emoji">${ch.emoji}</div>
      <div class="chore-info">
        <div class="chore-name">${ch.name} · <span style="color:var(--green)">${money(ch.value)}</span></div>
        <div class="chore-meta">${assigneeLabel(ch.assignedTo)} · ${freqLabel(ch)}</div>
      </div>
      <label class="switch" title="Switch chore on or off">
        <input type="checkbox" data-toggle="${ch.id}" ${ch.enabled === false ? '' : 'checked'}>
        <span class="knob"></span>
      </label>
      <div class="admin-chore-actions">
        <button class="mini-btn" data-edit="${ch.id}" title="Edit">✏️</button>
        <button class="mini-btn" data-del="${ch.id}" title="Remove">🗑️</button>
      </div>
    </div>`).join('') || '<p class="empty-state">No chores yet — add the first one!</p>';

  $$('#admin-chore-list [data-toggle]').forEach(t => t.addEventListener('change', async () => {
    await api('POST', '/api/admin/chores/toggle', { id: t.dataset.toggle, enabled: t.checked });
    toast(t.checked ? 'Chore switched on' : 'Chore paused', 'success');
    await refreshAdmin();
  }));
  $$('#admin-chore-list [data-edit]').forEach(b => b.addEventListener('click', () =>
    openChoreForm(admin.chores.find(c => c.id === b.dataset.edit))));
  $$('#admin-chore-list [data-del]').forEach(b => b.addEventListener('click', async () => {
    const chore = admin.chores.find(c => c.id === b.dataset.del);
    if (!confirm(`Remove "${chore.name}"? Past completions stay in history.`)) return;
    await api('DELETE', `/api/admin/chores?id=${b.dataset.del}`);
    toast('Chore removed', 'success');
    await refreshAdmin();
  }));
}

// `chore` is null (blank form), an existing chore (has .id → edit), or an
// idea template (no .id → prefilled new chore)
function openChoreForm(chore) {
  const isEdit = !!(chore && chore.id);
  $('#chore-form-title').textContent = isEdit ? 'Edit chore' : 'New chore';
  $('#cf-id').value = isEdit ? chore.id : '';
  $('#cf-name').value = chore ? chore.name : '';
  $('#cf-value').value = chore ? chore.value : '';
  $('#cf-currency').textContent = admin.settings.currency;
  $('#cf-error').classList.add('hidden');

  const emojiChoices = chore && chore.emoji && !EMOJIS.includes(chore.emoji) ? [chore.emoji, ...EMOJIS] : EMOJIS;
  $('#cf-emoji-row').innerHTML = emojiChoices.map(e =>
    `<button type="button" data-emoji="${e}" class="${chore && chore.emoji === e ? 'selected' : ''}">${e}</button>`).join('');
  if (!chore) $('#cf-emoji-row button').classList.add('selected');
  $$('#cf-emoji-row button').forEach(b => b.addEventListener('click', () => {
    $$('#cf-emoji-row button').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
  }));

  const assignees = [
    ...admin.children.map(c => ({ val: c.id, label: `Only ${c.name}` })),
    { val: 'each', label: 'Both (own chore each)' },
    { val: 'any', label: 'Anyone (first one wins)' },
  ];
  $('#cf-assigned').innerHTML = assignees.map(a =>
    `<button type="button" class="pill ${chore && chore.assignedTo === a.val ? 'selected' : ''}" data-val="${a.val}">${a.label}</button>`).join('');

  $$('#cf-frequency .pill').forEach(p =>
    p.classList.toggle('selected', chore ? chore.frequency === p.dataset.val : false));
  $('#cf-everydays').value = chore && chore.everyDays ? chore.everyDays : '';

  const syncCustomDays = () => {
    const isCustom = $('#cf-frequency .selected')?.dataset.val === 'custom';
    $('#cf-custom-days').classList.toggle('hidden', !isCustom);
  };
  syncCustomDays();

  $$('#cf-assigned .pill, #cf-frequency .pill').forEach(p => p.onclick = () => {
    [...p.parentElement.children].forEach(x => x.classList.remove('selected'));
    p.classList.add('selected');
    if (p.parentElement.id === 'cf-frequency') {
      syncCustomDays();
      if (p.dataset.val === 'custom') $('#cf-everydays').focus();
    }
  });

  $('#add-row').classList.add('hidden');
  $('#idea-list').classList.add('hidden');
  $('#chore-form').classList.remove('hidden');
  $('#cf-name').focus();
}

function closeChoreForm() {
  $('#chore-form').classList.add('hidden');
  $('#add-row').classList.remove('hidden');
}

$('#btn-new-chore').addEventListener('click', () => openChoreForm(null));
$('#cf-cancel').addEventListener('click', closeChoreForm);

$('#btn-ideas').addEventListener('click', () => {
  const list = $('#idea-list');
  if (!list.classList.contains('hidden')) { list.classList.add('hidden'); return; }
  list.innerHTML = CHORE_IDEAS.map((idea, i) => `
    <button type="button" class="idea-item" data-idea="${i}">
      <span class="idea-emoji">${idea.emoji}</span>
      <span class="idea-name">${idea.name}<br><span class="idea-freq">${FREQ_LABEL[idea.frequency]}</span></span>
      <span class="idea-value">${money(idea.value)}</span>
    </button>`).join('');
  $$('#idea-list .idea-item').forEach(b => b.addEventListener('click', () =>
    openChoreForm({ ...CHORE_IDEAS[Number(b.dataset.idea)], assignedTo: 'each' })));
  list.classList.remove('hidden');
});

$('#chore-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    id: $('#cf-id').value || undefined,
    name: $('#cf-name').value,
    emoji: $('#cf-emoji-row .selected')?.dataset.emoji || '⭐',
    value: $('#cf-value').value,
    assignedTo: $('#cf-assigned .selected')?.dataset.val,
    frequency: $('#cf-frequency .selected')?.dataset.val,
    everyDays: $('#cf-everydays').value,
  };
  try {
    await api(body.id ? 'PUT' : 'POST', '/api/admin/chores', body);
    toast('Chore saved!', 'success');
    closeChoreForm();
    await refreshAdmin();
  } catch (err) {
    const el = $('#cf-error');
    el.textContent = err.message;
    el.classList.remove('hidden');
  }
});

// --- payday tab ---

function renderPayday() {
  $('#payday-cards').innerHTML = admin.children.map(ch => `
    <div class="payday-card" style="--child-color:${state.children.find(s => s.id === ch.id)?.color || '#999'}">
      <div class="payday-top">
        <div class="child-avatar">${ch.emoji}</div>
        <div class="child-name">${ch.name}</div>
        <div class="payday-owed"><div class="num">${money(ch.balance)}</div><div class="lbl">In pocket</div></div>
      </div>
      <div class="payday-row">
        <input type="number" min="1" step="1" placeholder="Amount" id="pay-${ch.id}">
        <button class="payall-btn" data-payall="${ch.id}" data-balance="${ch.balance}">Pay all</button>
        <button class="primary-btn" data-pay="${ch.id}">Pay 💰</button>
      </div>
    </div>`).join('');

  $$('#payday-cards [data-payall]').forEach(b => b.addEventListener('click', () => {
    $(`#pay-${b.dataset.payall}`).value = Math.max(0, Number(b.dataset.balance));
  }));
  $$('#payday-cards [data-pay]').forEach(b => b.addEventListener('click', async () => {
    const childId = b.dataset.pay;
    const child = admin.children.find(c => c.id === childId);
    const amount = Number($(`#pay-${childId}`).value);
    if (!amount || amount <= 0) { toast('Enter an amount first', 'error'); return; }
    if (amount > child.balance && !confirm(`That's more than ${child.name} has in pocket (${money(child.balance)}). Pay anyway?`)) return;
    await api('POST', '/api/admin/payout', { childId, amount });
    toast(`Paid ${money(amount)} to ${child.name}`, 'success');
    await refreshAdmin();
  }));
}

// --- history tab ---

function renderHistory() {
  if (admin.history.length === 0) {
    $('#history-list').innerHTML = '<div class="empty-state"><div class="big">📜</div><p>Nothing here yet.</p></div>';
    return;
  }
  $('#history-list').innerHTML = admin.history.map(h => {
    const child = admin.children.find(c => c.id === h.childId);
    const when = new Date(h.at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <span class="who">${child ? child.emoji : '❓'}</span>
        <div class="what">
          <div class="lbl">${child ? child.name : '?'} · ${h.label}</div>
          <div class="when">${when}</div>
        </div>
        <span class="amt ${h.amount >= 0 ? 'pos' : 'neg'}">${h.amount >= 0 ? '+' : '−'}${money(Math.abs(h.amount))}</span>
        <button class="mini-btn" data-undo-kind="${h.kind}" data-undo-id="${h.id}" title="Undo">↩️</button>
      </div>`;
  }).join('');

  $$('#history-list [data-undo-id]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Undo this entry? The amounts will be adjusted.')) return;
    await api('POST', '/api/admin/undo', { kind: b.dataset.undoKind, id: b.dataset.undoId });
    toast('Undone', 'success');
    await refreshAdmin();
  }));
}

// --- settings tab ---

function renderSettings() {
  $('#settings-body').innerHTML = `
    <div class="settings-group">
      <h2>Avatars</h2>
      <p class="hint">Pick a face for each child.</p>
      ${admin.children.map(c => `
        <div>
          <span class="who-label">${c.name}</span>
          <div class="avatar-row" id="avatars-${c.id}">
            ${(AVATARS.includes(c.emoji) ? AVATARS : [c.emoji, ...AVATARS]).map(a =>
              `<button type="button" data-avatar="${a}" class="${c.emoji === a ? 'selected' : ''}">${a}</button>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="settings-group">
      <h2>Children's secret codes</h2>
      <p class="hint">4 digits each — they use these to mark chores done.</p>
      ${admin.children.map(c => `
        <div class="settings-row">
          <span class="who-label">${c.emoji} ${c.name}</span>
          <input type="text" inputmode="numeric" maxlength="4" id="setpin-${c.id}" value="${c.pin}">
        </div>`).join('')}
    </div>
    <div class="settings-group">
      <h2>Parent PIN</h2>
      <p class="hint">5 digits — protects this Parent Zone.</p>
      <div class="settings-row">
        <span class="who-label">🔒 PIN</span>
        <input type="text" inputmode="numeric" maxlength="5" id="set-adminpin" value="${adminPin}">
      </div>
    </div>
    <div class="settings-group">
      <h2>Daily chore time</h2>
      <p class="hint">When do daily chores appear each morning? They always expire at midnight.</p>
      <div class="settings-row">
        <span class="who-label">⏰ Appear at</span>
        <select id="set-starthour">
          ${[[0, 'Midnight'], [5, '05:00'], [6, '06:00'], [7, '07:00'], [8, '08:00'], [9, '09:00']].map(([h, label]) =>
            `<option value="${h}" ${(admin.settings.dailyStartHour || 0) === h ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="settings-group">
      <h2>Currency symbol</h2>
      <div class="settings-row">
        <span class="who-label">💱 Symbol</span>
        <input type="text" maxlength="3" id="set-currency" value="${admin.settings.currency}">
      </div>
    </div>
    <button class="primary-btn" id="btn-save-settings" style="width:100%">Save settings</button>`;

  admin.children.forEach(c => {
    $$(`#avatars-${c.id} button`).forEach(b => b.addEventListener('click', () => {
      $$(`#avatars-${c.id} button`).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    }));
  });

  $('#btn-save-settings').addEventListener('click', async () => {
    const childPins = {}, childEmojis = {};
    admin.children.forEach(c => {
      childPins[c.id] = $(`#setpin-${c.id}`).value.trim();
      childEmojis[c.id] = $(`#avatars-${c.id} .selected`)?.dataset.avatar || c.emoji;
    });
    const newAdminPin = $('#set-adminpin').value.trim();
    try {
      await api('POST', '/api/admin/settings', {
        childPins,
        childEmojis,
        adminPin: newAdminPin,
        currency: $('#set-currency').value.trim(),
        dailyStartHour: Number($('#set-starthour').value),
      });
      adminPin = newAdminPin;
      sessionStorage.setItem('adminPin', newAdminPin);
      toast('Settings saved!', 'success');
      await refreshAdmin();
      await loadDashboard();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

async function refreshAdmin() {
  state = await api('GET', '/api/state');
  await openAdmin();
}

// ---------- navigation ----------

$$('.btn-back').forEach(b => b.addEventListener('click', async () => {
  await loadDashboard();
  show('view-dashboard');
}));

// kick off
loadDashboard().catch(() => toast('Could not reach the server', 'error'));
