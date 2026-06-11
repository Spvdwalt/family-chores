// ===== Family Chores front-end =====

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

let state = null;            // dashboard state from /api/state
let currentChild = null;     // child whose chore list is open
let adminPin = null;         // held in memory only while the Parent Zone is open
let LANG = 'en';

// ---------- translations ----------

const STR = {
  en: {
    appTitle: 'Family Chores',
    allDone: '🎉 All done!',
    waiting: v => `✨ ${v.n} chore${v.n > 1 ? 's' : ''} waiting!`,
    pocket: 'Pocket', earned: 'Earned', paidOut: 'Paid out',
    choresTitle: v => `${v.name}'s chores`,
    freqDaily: 'Every day', freqWeekly: 'Once a week', freqOnce: 'Once-off',
    freqCustom: v => `Every ${v.n} days`, custom: 'Custom…', every: 'Every', days: 'days',
    firstOneWins: 'first one wins!',
    emptyTitle: 'All done for now!', emptySub: 'Check back later for more chores.',
    doneToday: 'Done today 🎉',
    enterCode: v => `${v.name}, enter your secret code`,
    parentsOnly: 'Parents only — enter PIN',
    wellDone: v => `Well done, ${v.name}!`, youEarned: v => `You earned ${v.amount}!`,
    justDone: 'Oops — that one was just done!',
    serverError: 'Could not reach the server',
    parentZone: 'Parent Zone',
    tabChores: 'Chores', tabPayday: 'Pay Day', tabHistory: 'History', tabSettings: 'Settings',
    addChore: '＋ Add a chore', ideas: '💡 Ideas',
    newChore: 'New chore', editChore: 'Edit chore',
    cfName: 'What needs doing?', cfNamePh: 'e.g. Feed the dog', cfIcon: 'Pick an icon',
    cfWorth: 'Worth', cfWho: 'Who can do it?', cfHowOften: 'How often?',
    cancel: 'Cancel', saveChore: 'Save chore',
    onlyName: v => `Only ${v.name}`, bothEach: 'Both (own chore each)', anyone: 'Anyone (first one wins)',
    choreSaved: 'Chore saved!', choreRemoved: 'Chore removed',
    removeConfirm: v => `Remove "${v.name}"? Past completions stay in history.`,
    choreOn: 'Chore switched on', chorePaused: 'Chore paused',
    noChoresYet: 'No chores yet — add the first one!',
    inPocket: 'In pocket', payAll: 'Pay all', pay: 'Pay 💰', amount: 'Amount',
    enterAmount: 'Enter an amount first',
    paidTo: v => `Paid ${v.amount} to ${v.name}`,
    overpayConfirm: v => `That's more than ${v.name} has in pocket (${v.amount}). Pay anyway?`,
    payDayLabel: '💰 Pay day',
    historyEmpty: 'Nothing here yet.',
    undoConfirm: 'Undo this entry? The amounts will be adjusted.', undone: 'Undone',
    avatarsHead: 'Avatars', avatarsHint: 'Pick a face for each child.',
    birthdaysHead: 'Birthdays', birthdaysHint: 'On their birthday they get a party hat and a surprise. 🎂',
    codesHead: "Children's secret codes", codesHint: '4 digits each — they use these to mark chores done.',
    pinHead: 'Parent PIN', pinHint: '5 digits — protects this Parent Zone.',
    timeHead: 'Daily chore time', timeHint: 'When do daily chores appear each morning? They always expire at midnight.',
    appearAt: 'Appear at', midnight: 'Midnight',
    currencyHead: 'Currency symbol', symbol: 'Symbol',
    languageHead: 'Language',
    saveSettings: 'Save settings', settingsSaved: 'Settings saved!',
    pickLook: 'Pick your new look!',
    lookingGood: v => `Looking good, ${v.name}! ${v.emoji}`,
    happyBirthday: v => `Happy birthday, ${v.name}!`,
    yearsToday: v => `${v.age} years old today! 🥳`,
    birthdayPill: v => `🎂 Happy birthday — ${v.age} today!`,
  },
  af: {
    appTitle: 'Gesinstakies',
    allDone: '🎉 Alles klaar!',
    waiting: v => `✨ ${v.n} takie${v.n > 1 ? 's' : ''} wag!`,
    pocket: 'Beursie', earned: 'Verdien', paidOut: 'Uitbetaal',
    choresTitle: v => `${v.name} se takies`,
    freqDaily: 'Elke dag', freqWeekly: "Een keer 'n week", freqOnce: 'Eenmalig',
    freqCustom: v => `Elke ${v.n} dae`, custom: 'Eie keuse…', every: 'Elke', days: 'dae',
    firstOneWins: 'eerste een wen!',
    emptyTitle: 'Alles klaar vir nou!', emptySub: 'Kom kyk later weer vir nuwe takies.',
    doneToday: 'Vandag gedoen 🎉',
    enterCode: v => `${v.name}, sleutel jou geheime kode in`,
    parentsOnly: 'Net ouers — sleutel PIN in',
    wellDone: v => `Mooi so, ${v.name}!`, youEarned: v => `Jy het ${v.amount} verdien!`,
    justDone: 'Oeps — daai een is nou net gedoen!',
    serverError: 'Kon nie die bediener bereik nie',
    parentZone: 'Ouersone',
    tabChores: 'Takies', tabPayday: 'Betaaldag', tabHistory: 'Geskiedenis', tabSettings: 'Instellings',
    addChore: "＋ Voeg 'n takie by", ideas: '💡 Idees',
    newChore: 'Nuwe takie', editChore: 'Wysig takie',
    cfName: 'Wat moet gedoen word?', cfNamePh: 'bv. Voer die hond', cfIcon: "Kies 'n prentjie",
    cfWorth: 'Werd', cfWho: 'Wie kan dit doen?', cfHowOften: 'Hoe gereeld?',
    cancel: 'Kanselleer', saveChore: 'Stoor takie',
    onlyName: v => `Net ${v.name}`, bothEach: 'Albei (elkeen sy eie)', anyone: 'Enigiemand (eerste een wen)',
    choreSaved: 'Takie gestoor!', choreRemoved: 'Takie verwyder',
    removeConfirm: v => `Verwyder "${v.name}"? Die geskiedenis bly behoue.`,
    choreOn: 'Takie aangeskakel', chorePaused: 'Takie afgeskakel',
    noChoresYet: "Nog geen takies nie — voeg die eerste een by!",
    inPocket: 'In beursie', payAll: 'Betaal alles', pay: 'Betaal 💰', amount: 'Bedrag',
    enterAmount: "Sleutel eers 'n bedrag in",
    paidTo: v => `${v.amount} aan ${v.name} betaal`,
    overpayConfirm: v => `Dis meer as wat ${v.name} in die beursie het (${v.amount}). Betaal in elk geval?`,
    payDayLabel: '💰 Betaaldag',
    historyEmpty: 'Nog niks hier nie.',
    undoConfirm: 'Ontdoen hierdie inskrywing? Die bedrae sal aangepas word.', undone: 'Ontdoen',
    avatarsHead: 'Prentjies', avatarsHint: "Kies 'n gesiggie vir elke kind.",
    birthdaysHead: 'Verjaarsdae', birthdaysHint: "Op hul verjaarsdag kry hulle 'n partytjiehoed en 'n verrassing. 🎂",
    codesHead: 'Kinders se geheime kodes', codesHint: '4 syfers elk — hulle gebruik dit om takies klaar te merk.',
    pinHead: 'Ouer PIN', pinHint: '5 syfers — beskerm hierdie Ouersone.',
    timeHead: 'Daaglikse takie-tyd', timeHint: 'Wanneer verskyn daaglikse takies elke oggend? Hulle verval altyd om middernag.',
    appearAt: 'Verskyn om', midnight: 'Middernag',
    currencyHead: 'Geldeenheid-simbool', symbol: 'Simbool',
    languageHead: 'Taal',
    saveSettings: 'Stoor instellings', settingsSaved: 'Instellings gestoor!',
    pickLook: 'Kies jou nuwe gesiggie!',
    lookingGood: v => `Lyk goed, ${v.name}! ${v.emoji}`,
    happyBirthday: v => `Veels geluk, ${v.name}!`,
    yearsToday: v => `${v.age} jaar oud vandag! 🥳`,
    birthdayPill: v => `🎂 Veels geluk — ${v.age} vandag!`,
  },
};

// server validation messages worth translating
const SERVER_MSG_AF = {
  'Chore needs a name': "Die takie het 'n naam nodig",
  'Value must be more than 0': 'Waarde moet meer as 0 wees',
  'Pick who can do it': 'Kies wie dit kan doen',
  'Pick a frequency': 'Kies hoe gereeld',
  'Custom days must be a whole number from 2 to 365': "Eie dae moet 'n heelgetal van 2 tot 365 wees",
  'Amount must be more than 0': 'Bedrag moet meer as 0 wees',
  'Parent PIN must be exactly 5 digits': 'Ouer PIN moet presies 5 syfers wees',
  'Child codes must be exactly 4 digits': 'Kinderkodes moet presies 4 syfers wees',
  'Each child needs a different code': "Elke kind het 'n ander kode nodig",
  'Currency must be 1-3 characters': 'Geldeenheid moet 1-3 karakters wees',
  'Birthdays must be valid dates': 'Verjaarsdae moet geldige datums wees',
  'Pick a valid avatar': "Kies 'n geldige prentjie",
};

function t(key, vars) {
  const s = STR[LANG][key] ?? STR.en[key] ?? key;
  return typeof s === 'function' ? s(vars || {}) : s;
}
function trServer(msg) {
  return LANG === 'af' ? (SERVER_MSG_AF[msg] || msg) : msg;
}
function locale() { return LANG === 'af' ? 'af-ZA' : undefined; }

function applyStatic() {
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#cf-name').placeholder = t('cfNamePh');
  document.title = t('appTitle');
}

// ---------- catalogues ----------

const EMOJIS = ['⭐','🛏️','🧸','🧹','🍽️','🥣','🐕','🐈','🌿','🏊','🗑️','👕','📚','🧺','🪥','⚽','🚿','🧽','🥕','🚗','🛒','🧦','🪟','🍞'];
const AVATARS = ['🦁','🐻','🐯','🦊','🐵','🐶','🐱','🐼','🐨','🦖','🦄','🐸','🐧','🦅','🐬','🚀','⚽','🌟'];
const CHORE_IDEAS = [
  { name: { en: 'Pack the dishwasher', af: 'Pak die skottelgoedwasser' }, emoji: '🍽️', value: 5, frequency: 'daily' },
  { name: { en: 'Take dishes to the kitchen', af: 'Vat skottelgoed kombuis toe' }, emoji: '🥣', value: 3, frequency: 'daily' },
  { name: { en: 'Make your bed', af: 'Maak jou bed op' }, emoji: '🛏️', value: 5, frequency: 'daily' },
  { name: { en: 'Tidy up your toys', af: 'Ruim jou speelgoed op' }, emoji: '🧸', value: 5, frequency: 'daily' },
  { name: { en: 'Take out the rubbish', af: 'Vat die vullis uit' }, emoji: '🗑️', value: 5, frequency: 'daily' },
  { name: { en: 'Feed the pets', af: 'Voer die troeteldiere' }, emoji: '🐕', value: 5, frequency: 'daily' },
  { name: { en: 'Dirty clothes in the basket', af: 'Vuil klere in die wasgoedmandjie' }, emoji: '👕', value: 3, frequency: 'daily' },
  { name: { en: 'Help fold the washing', af: 'Help wasgoed vou' }, emoji: '🧺', value: 8, frequency: 'weekly' },
  { name: { en: 'Water the plants', af: 'Gee die plante water' }, emoji: '🌿', value: 5, frequency: 'weekly' },
  { name: { en: 'Sweep the pool', af: 'Vee die swembad' }, emoji: '🏊', value: 20, frequency: 'weekly' },
  { name: { en: 'Help wash the car', af: 'Help die kar was' }, emoji: '🚗', value: 15, frequency: 'weekly' },
  { name: { en: 'Sweep the kitchen floor', af: 'Vee die kombuisvloer' }, emoji: '🧹', value: 8, frequency: 'daily' },
  { name: { en: 'Wipe the table after dinner', af: 'Vee die tafel af na ete' }, emoji: '🪟', value: 3, frequency: 'daily' },
  { name: { en: 'Pack away your school bag', af: 'Pak jou skooltas weg' }, emoji: '📚', value: 3, frequency: 'daily' },
  { name: { en: 'Help unpack the groceries', af: 'Help die kruideniersware uitpak' }, emoji: '🛒', value: 5, frequency: 'weekly' },
  { name: { en: 'Match the socks', af: 'Pas die sokkies bymekaar' }, emoji: '🧦', value: 5, frequency: 'weekly' },
  { name: { en: 'Brush teeth without being asked', af: 'Borsel tande sonder om gevra te word' }, emoji: '🪥', value: 2, frequency: 'daily' },
  { name: { en: 'Hang up your towel', af: 'Hang jou handdoek op' }, emoji: '🚿', value: 2, frequency: 'daily' },
  { name: { en: 'Pack away outside toys', af: 'Pak buite-speelgoed weg' }, emoji: '⚽', value: 5, frequency: 'daily' },
  { name: { en: 'Help make breakfast', af: 'Help ontbyt maak' }, emoji: '🍞', value: 5, frequency: 'weekly' },
];

function freqLabel(ch) {
  if (ch.frequency === 'custom') return t('freqCustom', { n: ch.everyDays });
  return t({ daily: 'freqDaily', weekly: 'freqWeekly', once: 'freqOnce' }[ch.frequency]);
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
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
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
  showCelebration(['🎉','🌟','🏆','🥳','💪'][Math.floor(Math.random() * 5)],
    t('wellDone', { name: childName }), t('youEarned', { amount: money(value) }));
}

function showCelebration(emoji, title, sub) {
  $('#celebrate-emoji').textContent = emoji;
  $('#celebrate-text').textContent = title;
  $('#celebrate-sub').textContent = sub;
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
  LANG = state.language || 'en';
  applyStatic();
  $('#today-line').textContent =
    new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

  $('#child-cards').innerHTML = state.children.map(ch => {
    const banner = ch.availableCount > 0
      ? `<span class="chore-banner">${t('waiting', { n: ch.availableCount })}</span>`
      : `<span class="chore-banner all-done">${t('allDone')}</span>`;
    const birthdayPill = ch.isBirthday
      ? `<div><span class="chore-banner birthday">${t('birthdayPill', { age: ch.age })}</span></div>` : '';
    return `
      <button class="child-card" data-child="${ch.id}" style="--child-color:${ch.color}">
        <div class="child-top">
          <div class="child-avatar">${ch.emoji}${ch.isBirthday ? '<span class="party-hat">🎉</span>' : ''}</div>
          <div>
            <div class="child-name">${ch.name}</div>
            ${birthdayPill}
            <div>${banner}</div>
          </div>
        </div>
        <div class="child-stats">
          <div class="stat pocket"><div class="num">${money(ch.balance)}</div><div class="lbl">${t('pocket')}</div></div>
          <div class="stat"><div class="num">${money(ch.earned)}</div><div class="lbl">${t('earned')}</div></div>
          <div class="stat"><div class="num">${money(ch.paidOut)}</div><div class="lbl">${t('paidOut')}</div></div>
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
  $('#chores-title').textContent = t('choresTitle', { name: currentChild.name });
  $('#btn-avatar').textContent = currentChild.emoji;
  const { chores } = await api('GET', `/api/chores?childId=${childId}`);

  if (chores.length === 0) {
    $('#chore-list').innerHTML = `
      <div class="empty-state">
        <div class="big">🎉</div>
        <p><strong>${t('emptyTitle')}</strong></p>
        <p>${t('emptySub')}</p>
      </div>`;
  } else {
    $('#chore-list').innerHTML = chores.map(ch => `
      <button class="chore-card" data-chore="${ch.id}">
        <div class="chore-emoji">${ch.emoji}</div>
        <div class="chore-info">
          <div class="chore-name">${ch.name}</div>
          <div class="chore-meta">${freqLabel(ch)}${ch.assignedTo === 'any' ? ' · ' + t('firstOneWins') : ''}</div>
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
    title: t('enterCode', { name: currentChild.name }),
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
          toast(t('justDone'), 'error');
          await loadDashboard();
          await openChild(currentChild.id);
          return true;
        }
        toast(trServer(err.message), 'error');
        return true;
      }
    },
  });
}

// ---------- child avatar picker (tap your face in the title) ----------

$('#btn-avatar').addEventListener('click', () => {
  if (!currentChild) return;
  // code first, then the picker — the whole feature sits behind the child's PIN
  pinPad.open({
    title: t('enterCode', { name: currentChild.name }),
    avatar: currentChild.emoji,
    digits: 4,
    handler: async pin => {
      try {
        await api('POST', '/api/child/verify', { childId: currentChild.id, pin });
        openAvatarGrid(pin);
        return true;
      } catch (err) {
        if (err.code === 'wrong-pin') return false;
        toast(trServer(err.message), 'error');
        return true;
      }
    },
  });
});

function openAvatarGrid(verifiedPin) {
  $('#avatar-grid').innerHTML = AVATARS.map(a =>
    `<button type="button" data-pick="${a}" class="${currentChild.emoji === a ? 'selected' : ''}">${a}</button>`).join('');
  $$('#avatar-grid [data-pick]').forEach(b => b.addEventListener('click', async () => {
    const chosen = b.dataset.pick;
    $('#avatar-overlay').classList.add('hidden');
    if (chosen === currentChild.emoji) return;
    try {
      await api('POST', '/api/child/avatar', { childId: currentChild.id, pin: verifiedPin, emoji: chosen });
      currentChild.emoji = chosen;
      $('#btn-avatar').textContent = chosen;
      toast(t('lookingGood', { name: currentChild.name, emoji: chosen }), 'success');
      state = await api('GET', '/api/state');
    } catch (err) {
      toast(trServer(err.message), 'error');
    }
  }));
  $('#avatar-overlay').classList.remove('hidden');
}
$('#avatar-cancel').addEventListener('click', () => $('#avatar-overlay').classList.add('hidden'));

// ---------- admin ----------

// the PIN pad opens EVERY time the gear is tapped — the PIN is never stored,
// so kids on a shared tablet can't walk into the Parent Zone
$('#btn-admin').addEventListener('click', () => {
  adminPin = null;
  pinPad.open({
    title: t('parentsOnly'),
    avatar: '🔒',
    digits: 5,
    handler: async pin => {
      try {
        await api('POST', '/api/admin/login', { pin });
        adminPin = pin;
        await openAdmin();
        return true;
      } catch { return false; }
    },
  });
});

let admin = null; // overview payload

async function openAdmin() {
  admin = await api('GET', '/api/admin/overview');
  renderAdminChores();
  renderPayday();
  renderHistory();
  renderSettings();
  show('view-admin');
}

$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === tab));
  $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab.dataset.tab));
}));

function assigneeLabel(assignedTo) {
  if (assignedTo === 'each') return t('bothEach');
  if (assignedTo === 'any') return t('anyone');
  const ch = admin.children.find(c => c.id === assignedTo);
  return ch ? t('onlyName', { name: ch.name }) : assignedTo;
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
      <label class="switch" title="On / off">
        <input type="checkbox" data-toggle="${ch.id}" ${ch.enabled === false ? '' : 'checked'}>
        <span class="knob"></span>
      </label>
      <div class="admin-chore-actions">
        <button class="mini-btn" data-edit="${ch.id}" title="Edit">✏️</button>
        <button class="mini-btn" data-del="${ch.id}" title="Remove">🗑️</button>
      </div>
    </div>`).join('') || `<p class="empty-state">${t('noChoresYet')}</p>`;

  $$('#admin-chore-list [data-toggle]').forEach(sw => sw.addEventListener('change', async () => {
    await api('POST', '/api/admin/chores/toggle', { id: sw.dataset.toggle, enabled: sw.checked });
    toast(sw.checked ? t('choreOn') : t('chorePaused'), 'success');
    await refreshAdmin();
  }));
  $$('#admin-chore-list [data-edit]').forEach(b => b.addEventListener('click', () =>
    openChoreForm(admin.chores.find(c => c.id === b.dataset.edit))));
  $$('#admin-chore-list [data-del]').forEach(b => b.addEventListener('click', async () => {
    const chore = admin.chores.find(c => c.id === b.dataset.del);
    if (!confirm(t('removeConfirm', { name: chore.name }))) return;
    await api('DELETE', `/api/admin/chores?id=${b.dataset.del}`);
    toast(t('choreRemoved'), 'success');
    await refreshAdmin();
  }));
}

// `chore` is null (blank form), an existing chore (has .id → edit), or an
// idea template (no .id → prefilled new chore)
function openChoreForm(chore) {
  const isEdit = !!(chore && chore.id);
  $('#chore-form-title').textContent = isEdit ? t('editChore') : t('newChore');
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
    ...admin.children.map(c => ({ val: c.id, label: t('onlyName', { name: c.name }) })),
    { val: 'each', label: t('bothEach') },
    { val: 'any', label: t('anyone') },
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
      <span class="idea-name">${idea.name[LANG] || idea.name.en}<br><span class="idea-freq">${freqLabel(idea)}</span></span>
      <span class="idea-value">${money(idea.value)}</span>
    </button>`).join('');
  $$('#idea-list .idea-item').forEach(b => b.addEventListener('click', () => {
    const idea = CHORE_IDEAS[Number(b.dataset.idea)];
    openChoreForm({ ...idea, name: idea.name[LANG] || idea.name.en, assignedTo: 'each' });
  }));
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
    toast(t('choreSaved'), 'success');
    closeChoreForm();
    await refreshAdmin();
  } catch (err) {
    const el = $('#cf-error');
    el.textContent = trServer(err.message);
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
        <div class="payday-owed"><div class="num">${money(ch.balance)}</div><div class="lbl">${t('inPocket')}</div></div>
      </div>
      <div class="payday-row">
        <input type="number" min="1" step="1" placeholder="${t('amount')}" id="pay-${ch.id}">
        <button class="payall-btn" data-payall="${ch.id}" data-balance="${ch.balance}">${t('payAll')}</button>
        <button class="primary-btn" data-pay="${ch.id}">${t('pay')}</button>
      </div>
    </div>`).join('');

  $$('#payday-cards [data-payall]').forEach(b => b.addEventListener('click', () => {
    $(`#pay-${b.dataset.payall}`).value = Math.max(0, Number(b.dataset.balance));
  }));
  $$('#payday-cards [data-pay]').forEach(b => b.addEventListener('click', async () => {
    const childId = b.dataset.pay;
    const child = admin.children.find(c => c.id === childId);
    const amount = Number($(`#pay-${childId}`).value);
    if (!amount || amount <= 0) { toast(t('enterAmount'), 'error'); return; }
    if (amount > child.balance && !confirm(t('overpayConfirm', { name: child.name, amount: money(child.balance) }))) return;
    await api('POST', '/api/admin/payout', { childId, amount });
    toast(t('paidTo', { amount: money(amount), name: child.name }), 'success');
    await refreshAdmin();
  }));
}

// --- history tab ---

function renderHistory() {
  if (admin.history.length === 0) {
    $('#history-list').innerHTML = `<div class="empty-state"><div class="big">📜</div><p>${t('historyEmpty')}</p></div>`;
    return;
  }
  $('#history-list').innerHTML = admin.history.map(h => {
    const child = admin.children.find(c => c.id === h.childId);
    const when = new Date(h.at).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const label = h.kind === 'payout' ? t('payDayLabel') : h.label;
    return `
      <div class="history-item">
        <span class="who">${child ? child.emoji : '❓'}</span>
        <div class="what">
          <div class="lbl">${child ? child.name : '?'} · ${label}</div>
          <div class="when">${when}</div>
        </div>
        <span class="amt ${h.amount >= 0 ? 'pos' : 'neg'}">${h.amount >= 0 ? '+' : '−'}${money(Math.abs(h.amount))}</span>
        <button class="mini-btn" data-undo-kind="${h.kind}" data-undo-id="${h.id}" title="Undo">↩️</button>
      </div>`;
  }).join('');

  $$('#history-list [data-undo-id]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm(t('undoConfirm'))) return;
    await api('POST', '/api/admin/undo', { kind: b.dataset.undoKind, id: b.dataset.undoId });
    toast(t('undone'), 'success');
    await refreshAdmin();
  }));
}

// --- settings tab ---

function renderSettings() {
  $('#settings-body').innerHTML = `
    <div class="settings-group">
      <h2>${t('languageHead')}</h2>
      <div class="settings-row">
        <span class="who-label">🌍 ${t('languageHead')}</span>
        <select id="set-language">
          <option value="en" ${(admin.settings.language || 'en') === 'en' ? 'selected' : ''}>English</option>
          <option value="af" ${admin.settings.language === 'af' ? 'selected' : ''}>Afrikaans</option>
        </select>
      </div>
    </div>
    <div class="settings-group">
      <h2>${t('avatarsHead')}</h2>
      <p class="hint">${t('avatarsHint')}</p>
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
      <h2>${t('birthdaysHead')}</h2>
      <p class="hint">${t('birthdaysHint')}</p>
      ${admin.children.map(c => `
        <div class="settings-row">
          <span class="who-label">${c.emoji} ${c.name}</span>
          <input type="date" id="setbday-${c.id}" value="${c.birthday}">
        </div>`).join('')}
    </div>
    <div class="settings-group">
      <h2>${t('codesHead')}</h2>
      <p class="hint">${t('codesHint')}</p>
      ${admin.children.map(c => `
        <div class="settings-row">
          <span class="who-label">${c.emoji} ${c.name}</span>
          <input type="text" inputmode="numeric" maxlength="4" id="setpin-${c.id}" value="${c.pin}">
        </div>`).join('')}
    </div>
    <div class="settings-group">
      <h2>${t('pinHead')}</h2>
      <p class="hint">${t('pinHint')}</p>
      <div class="settings-row">
        <span class="who-label">🔒 PIN</span>
        <input type="text" inputmode="numeric" maxlength="5" id="set-adminpin" value="${adminPin}">
      </div>
    </div>
    <div class="settings-group">
      <h2>${t('timeHead')}</h2>
      <p class="hint">${t('timeHint')}</p>
      <div class="settings-row">
        <span class="who-label">⏰ ${t('appearAt')}</span>
        <select id="set-starthour">
          ${[[0, t('midnight')], [5, '05:00'], [6, '06:00'], [7, '07:00'], [8, '08:00'], [9, '09:00']].map(([h, label]) =>
            `<option value="${h}" ${(admin.settings.dailyStartHour || 0) === h ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="settings-group">
      <h2>${t('currencyHead')}</h2>
      <div class="settings-row">
        <span class="who-label">💱 ${t('symbol')}</span>
        <input type="text" maxlength="3" id="set-currency" value="${admin.settings.currency}">
      </div>
    </div>
    <button class="primary-btn" id="btn-save-settings" style="width:100%">${t('saveSettings')}</button>`;

  admin.children.forEach(c => {
    $$(`#avatars-${c.id} button`).forEach(b => b.addEventListener('click', () => {
      $$(`#avatars-${c.id} button`).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    }));
  });

  $('#btn-save-settings').addEventListener('click', async () => {
    const childPins = {}, childEmojis = {}, childBirthdays = {};
    admin.children.forEach(c => {
      childPins[c.id] = $(`#setpin-${c.id}`).value.trim();
      childEmojis[c.id] = $(`#avatars-${c.id} .selected`)?.dataset.avatar || c.emoji;
      childBirthdays[c.id] = $(`#setbday-${c.id}`).value;
    });
    const newAdminPin = $('#set-adminpin').value.trim();
    try {
      await api('POST', '/api/admin/settings', {
        childPins,
        childEmojis,
        childBirthdays,
        adminPin: newAdminPin,
        currency: $('#set-currency').value.trim(),
        dailyStartHour: Number($('#set-starthour').value),
        language: $('#set-language').value,
      });
      adminPin = newAdminPin;
      await loadDashboard();
      await refreshAdmin();
      toast(t('settingsSaved'), 'success');
    } catch (err) {
      toast(trServer(err.message), 'error');
    }
  });
}

async function refreshAdmin() {
  state = await api('GET', '/api/state');
  LANG = state.language || 'en';
  applyStatic();
  await openAdmin();
}

// ---------- navigation ----------

$$('.btn-back').forEach(b => b.addEventListener('click', async () => {
  adminPin = null; // leaving the Parent Zone always locks it again
  await loadDashboard();
  show('view-dashboard');
}));

// kick off
loadDashboard().then(() => {
  // birthday fanfare, once per day per device
  const today = new Date().toDateString();
  state.children.filter(c => c.isBirthday).forEach((c, i) => {
    const key = `bday-${c.id}-${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setTimeout(() => showCelebration('🎂', t('happyBirthday', { name: c.name }), t('yearsToday', { age: c.age })), 600 + i * 2800);
  });
}).catch(() => toast(t('serverError'), 'error'));
