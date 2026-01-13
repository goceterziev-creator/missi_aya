/*
  MISY × AYA — Public Gateway (Frontend-only)
  - Working chat UI (Enter/Send)
  - Mode selector
  - Soft monetization (FREE daily limit + simulated PREMIUM toggle)
  - Memory Layer (meaning-only) via localStorage
  - AYA routing (travel/business/personal) — simulated structured output
*/

const STORAGE = {
  plan: 'misy_plan_v1', // FREE | PREMIUM
  daily: 'misy_daily_v1', // {date, used}
  memory: 'misy_memory_v1', // {items:[{ts,tag,text}]}
};

const LIMITS = { freePerDay: 10 };

const MISY = {
  currentMode: 'midnight',

  applyModeStyling(text) {
    const m = {
      midnight: `🌙 *полунощен тон* ${text}`,
      flirt: `😊 *игриво* ${text}`,
      executive: `💼 *прецизно* ${text}`,
      velvet: `🖤 *копринено* ${text}`,
      cafe: `☕ *топло* ${text}`,
    };
    return m[this.currentMode] || m.midnight;
  },

  routeCategory(input) {
    const t = input.toLowerCase();
    if (/(здравей|привет|hello|hi)/.test(t)) return 'greeting';
    if (/(пъту|самолет|полет|хотел|дестинац|нощувк|маршрут|итинера|trip|travel)/.test(t)) return 'travel';
    if (/(бизнес|пари|продажб|клиент|оферта|продукт|маркетинг|sales)/.test(t)) return 'business';
    return 'personal';
  },

  detectClarityMoment(input) {
    const t = input.toLowerCase();
    return /(направи|изгради|състави|дай ми|искам план|blueprint|итинера|маршрут|стратегия|оферта)/.test(t);
  },

  generateBase(category) {
    const lib = {
      greeting: [
        'Здравей. Тук съм. Нека започнем спокойно.',
        'Калимера. Кажи ми какво тежи най-много.',
        'Добър ден. Ще го подредим — без бързане.',
      ],
      personal: [
        'Първо дишаме. После решаваме. Кажи ми какво е важно за теб.',
        'Яснотата идва от рамка, не от много думи.',
        'Не си сам. Ще го подредим стъпка по стъпка.',
      ],
      business: [
        'Да го направим ясно: цел → оферта → канал → следваща стъпка.',
        'В бизнеса печели този, който е спокоен и последователен.',
        'Автентичността продава. Структурата скалира.',
      ],
      travel: [
        'Ок. Нека махнем хаоса: дати → зона → дневна логика.',
        'Пътуването става лесно, когато редът е правилен.',
        'Добре. Ще го подредя по AYA логика с минимални въпроси.',
      ],
    };
    const arr = lib[category] || lib.personal;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  followUp(category) {
    const q = {
      greeting: 'С едно изречение: какво искаш да стане по-ясно днес?',
      personal: 'Кое е най-важното условие за теб в това решение?',
      business: 'Кое е 1-ното нещо, което трябва да се случи тази седмица?',
      travel: 'Кои са датите и колко човека пътувате?',
    };
    return q[category] || q.personal;
  },

  softGate(category, ctx) {
    if (ctx.plan === 'PREMIUM') {
      return `✅ *AYA Core е активиран*\n${this.simulateOutput(category, ctx.lastUserMessage)}`;
    }
    const label = category === 'travel' ? 'AYA Travel Blueprint' : 'AYA Clarity Output';
    return (
      'Това вече е момент за структура.\n' +
      `Ако искаш, мога да го подредя като **${label}** (платена част) — без натиск.\n` +
      'Можем и просто да поговорим.'
    );
  },

  simulateOutput(category, last) {
    if (category === 'travel') {
      return [
        '• Дати: (потвърди)',
        '• Пътуващи: (потвърди)',
        '• Зони за настаняване: 2–3 според стил',
        '• Дневна логика: сутрин / следобед / вечер',
        '• Бюджет: 3 нива (Standard / Comfort / Premium)',
        '• Следваща стъпка: 1 решение, не 10 таба',
      ].join('\n');
    }
    if (category === 'business') {
      return [
        '• Цел (1 изречение)',
        '• Оферта (какво точно продаваш)',
        '• Канал (къде го казваш)',
        '• Следваща стъпка (едно действие днес)',
        `• Контекст: „${truncate(last, 90)}"`,
      ].join('\n');
    }
    return [
      '• Какво е важно (1–2 условия)',
      '• Какво е риск (1 честен страх)',
      '• Следваща стъпка (малка и изпълнима)',
      `• Контекст: „${truncate(last, 90)}"`,
    ].join('\n');
  },

  respond(input, ctx) {
    const category = this.routeCategory(input);
    const base = this.generateBase(category);

    if (this.detectClarityMoment(input)) {
      return this.applyModeStyling(`${base}\n\n${this.softGate(category, ctx)}`);
    }

    return this.applyModeStyling(`${base}\n\n${this.followUp(category)}`);
  },
};

// ---------------- Memory Layer (meaning-only) ----------------
function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE.memory);
    const data = raw ? JSON.parse(raw) : { items: [] };
    if (!Array.isArray(data.items)) data.items = [];
    return data;
  } catch {
    return { items: [] };
  }
}

function saveMemory(mem) {
  localStorage.setItem(STORAGE.memory, JSON.stringify(mem));
}

function extractMeaning(input) {
  const t = input.toLowerCase();
  const hits = [];
  if (/(важно|условие|държа на|приоритет)/.test(t)) hits.push({ tag: 'value', text: input });
  if (/(страх|притеснява|не искам|рискувам)/.test(t)) hits.push({ tag: 'risk', text: input });
  if (/(искам|целта ми|трябва да|търся)/.test(t)) hits.push({ tag: 'intent', text: input });
  if (/(бързо|кратко|директно|спокойно|меко)/.test(t)) hits.push({ tag: 'style', text: input });
  return hits.slice(0, 2);
}

function updateMemory(input) {
  const mem = loadMemory();
  const ex = extractMeaning(input);
  if (!ex.length) return;
  const now = Date.now();
  ex.forEach((e) => mem.items.unshift({ ts: now, tag: e.tag, text: truncate(e.text, 140) }));
  mem.items = mem.items.slice(0, 12);
  saveMemory(mem);
}

function memoryHintHtml() {
  const mem = loadMemory();
  const last = mem.items.find((x) => x.tag === 'value' || x.tag === 'style');
  if (!last) return '';
  return `<small>Помня смисъл: ${escapeHtml(truncate(last.text, 90))}</small>`;
}

// ---------------- Plan + Daily Limit ----------------
function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getPlan() {
  return localStorage.getItem(STORAGE.plan) === 'PREMIUM' ? 'PREMIUM' : 'FREE';
}

function setPlan(plan) {
  localStorage.setItem(STORAGE.plan, plan);
}

function getDaily() {
  try {
    const raw = localStorage.getItem(STORAGE.daily);
    const obj = raw ? JSON.parse(raw) : { date: todayKey(), used: 0 };
    if (obj.date !== todayKey()) return { date: todayKey(), used: 0 };
    return obj;
  } catch {
    return { date: todayKey(), used: 0 };
  }
}

function setDaily(obj) {
  localStorage.setItem(STORAGE.daily, JSON.stringify(obj));
}

function canSend(plan) {
  if (plan === 'PREMIUM') return { ok: true };
  const d = getDaily();
  if (d.used >= LIMITS.freePerDay) return { ok: false, reason: `Достигна лимита ${LIMITS.freePerDay}/ден (FREE).` };
  return { ok: true };
}

function incDaily() {
  const d = getDaily();
  d.used += 1;
  setDaily(d);
  return d;
}

// ---------------- UI Helpers ----------------
function $(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function truncate(str, n) {
  const s = String(str || '');
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => el.classList.remove('show'), 2400);
}

function appendMessage(role, text, extraHtml = '') {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `${escapeHtml(text)}${extraHtml ? `<br/>${extraHtml}` : ''}`;

  wrap.appendChild(bubble);
  $('chatMessages').appendChild(wrap);

  // scroll to bottom
  $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
}

function updatePlanBadge() {
  const plan = getPlan();
  const badge = $('planBadge');
  const limit = $('limitBadge');
  if (badge) badge.innerHTML = `План: <b>${plan}</b> · Лимит: <b id="limitBadge">${plan === 'PREMIUM' ? '∞' : `${LIMITS.freePerDay}/ден`}</b>`;
  if (limit) limit.textContent = plan === 'PREMIUM' ? '∞' : `${LIMITS.freePerDay}/ден`;
}

function sendUserMessage() {
  const input = $('userInput');
  const txt = (input.value || '').trim();
  if (!txt) return;

  const plan = getPlan();
  const gate = canSend(plan);
  if (!gate.ok) {
    showToast(gate.reason + ' Натисни “Купи сега” за PREMIUM (симулация).');
    return;
  }

  appendMessage('user', txt);
  input.value = '';

  // Memory
  updateMemory(txt);

  // Daily counter for FREE
  if (plan === 'FREE') {
    const d = incDaily();
    const left = Math.max(0, LIMITS.freePerDay - d.used);
    if (left <= 2) showToast(`Остават ${left} FREE съобщения за днес.`);
  }

  // MISY response
  const ctx = { plan, lastUserMessage: txt };
  const reply = MISY.respond(txt, ctx);
  const hint = memoryHintHtml();
  window.setTimeout(() => appendMessage('misy', reply, hint), 250);
}

function bindModes() {
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      MISY.currentMode = btn.dataset.mode || 'midnight';
      showToast(`Режим: ${btn.textContent.trim()}`);
    });
  });
}

function initPremiumButton() {
  const btn = $('premiumBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = getPlan();
    if (cur === 'PREMIUM') {
      setPlan('FREE');
      showToast('PREMIUM е изключен (симулация).');
    } else {
      setPlan('PREMIUM');
      showToast('PREMIUM е активиран (симулация).');
    }
    updatePlanBadge();
  });
}

function welcome() {
  const plan = getPlan();
  const greet = MISY.applyModeStyling('Аз съм МИСИ — човешкият вход към AYA. Пиши ми свободно.');
  const note = plan === 'PREMIUM'
    ? '<small>PREMIUM: AYA Core може да връща структуриран резултат.</small>'
    : '<small>FREE: разговорът е свободен. Плаща се само за структуриран резултат.</small>';
  appendMessage('misy', greet, note);
}

// ---------------- Boot ----------------
document.addEventListener('DOMContentLoaded', () => {
  updatePlanBadge();
  bindModes();
  initPremiumButton();

  $('sendButton')?.addEventListener('click', sendUserMessage);
  $('userInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendUserMessage();
  });

  welcome();
});
