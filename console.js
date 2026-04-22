/* ================================================
   mobile-console.js  v2.7
   Использование: <script src="console.js"></script>
   ================================================ */

(function () {
  'use strict';

  const MAX_LINES = 300;
  let lines      = [];
  let filter     = 'ALL';
  let errorCount = 0;
  let jsHistory  = [];
  let jsHistIdx  = -1;

  /* ─── SVG иконки ─── */
  const ICO_COPY  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const ICO_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const ICO_TRASH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  const ICO_JS    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;
  const ICO_RUN   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const ICO_CON   = `<svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M5.646 9.146a.5.5 0 0 1 .708 0L8 10.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708zM14.5 13h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5V5.5zM5.5 4A1.5 1.5 0 0 0 4 5.5V6h12v-.5A1.5 1.5 0 0 0 14.5 4h-9zM4 7v7.5A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V7H4z"/></svg>`;

  /* ─── СТИЛИ ─── */
  const style = document.createElement('style');
  style.textContent = `
    /* ════ CSS-переменные: тёмная тема (по умолчанию) ════ */
    #_mc_wrap {
      --mc-bg:       #0d1117;
      --mc-bg2:      #080b10;
      --mc-border:   #1e2d3d;
      --mc-border2:  #111a22;
      --mc-title:    #00e5ff;
      --mc-btn-brd:  #2a3a4a;
      --mc-muted:    #6a8a9a;
      --mc-ts:       #4a5a6a;
      --mc-handle:   #2a3a4a;
      --mc-inp-bg:   #0d1117;
      --mc-inp-txt:  #ffffff;
      --mc-log-sep:  rgba(30,45,61,.4);
    }
    /* ════ Светлая тема ════ */
    #_mc_wrap.mc-light {
      --mc-bg:       #f2f4f7;
      --mc-bg2:      #e4e8ed;
      --mc-border:   #bdc7d3;
      --mc-border2:  #cdd5de;
      --mc-title:    #0077aa;
      --mc-btn-brd:  #aab4be;
      --mc-muted:    #4a5a6a;
      --mc-ts:       #7a8a9a;
      --mc-handle:   #bdc7d3;
      --mc-inp-bg:   #ffffff;
      --mc-inp-txt:  #111111;
      --mc-log-sep:  rgba(100,120,140,.2);
    }

    /* ════ Основной блок ════ */
    #_mc_wrap {
      display: none;
      position: fixed; left: 0; right: 0; bottom: 0;
      height: 200px; min-height: 50px; max-height: 75vh;
      background: var(--mc-bg);
      border-top: 2px solid var(--mc-border);
      z-index: 2147483646;
      font: 12px/1.4 'JetBrains Mono',monospace;
      flex-direction: column; box-sizing: border-box;
      transition: background .25s, border-color .25s;
    }
    #_mc_wrap.open { display: flex; }

    /* ── resize handle ── */
    #_mc_resize {
      width: 100%; height: 10px; flex-shrink: 0;
      cursor: ns-resize; touch-action: none;
      display: flex; align-items: center; justify-content: center;
    }
    #_mc_resize::after {
      content: ''; width: 40px; height: 3px;
      background: var(--mc-handle); border-radius: 2px;
      transition: background .25s;
    }
    #_mc_resize:hover::after { background: var(--mc-title); }

    /* ── тулбар ── */
    #_mc_toolbar {
      background: var(--mc-bg2);
      border-bottom: 1px solid var(--mc-border);
      flex-shrink: 0; box-sizing: border-box;
      transition: background .25s, border-color .25s;
    }
    #_mc_row1 {
      display: flex; align-items: center;
      padding: 3px 8px; gap: 5px;
    }
    #_mc_title {
      font-size: 10px; color: var(--mc-title);
      letter-spacing: .08em; flex: 1;
      white-space: nowrap; overflow: hidden;
      transition: color .25s;
    }

    /* ── все кнопки тулбара ── */
    #_mc_toolbar button {
      font: 11px/1 'JetBrains Mono',monospace;
      background: transparent;
      border: 1px solid var(--mc-btn-brd);
      border-radius: 3px; color: var(--mc-muted);
      cursor: pointer; padding: 3px 7px;
      white-space: nowrap; flex: 0 0 auto;
      width: auto; height: auto; margin: 0;
      transition: border-color .15s, color .15s, background .15s;
      display: inline-flex; align-items: center; gap: 4px;
    }

    #_mc_f_all.active  { border-color: var(--mc-title); color: var(--mc-title); background: rgba(0,180,220,.10); }
    #_mc_f_all:hover   { border-color: var(--mc-title); color: var(--mc-title); }
    #_mc_f_click.active{ border-color: #c9a0ff; color: #c9a0ff; background: rgba(201,160,255,.10); }
    #_mc_f_click:hover { border-color: #c9a0ff; color: #c9a0ff; }
    #_mc_f_ls.active   { border-color: #50b8a0; color: #50b8a0; background: rgba(80,184,160,.10); }
    #_mc_f_ls:hover    { border-color: #50b8a0; color: #50b8a0; }
    #_mc_js_btn.active { border-color: #e8b400; color: #e8b400; background: rgba(232,180,0,.10); }
    #_mc_js_btn:hover  { border-color: #e8b400; color: #e8b400; }

    #_mc_cpy, #_mc_clr { padding: 3px 6px; }
    #_mc_cpy:hover { border-color: var(--mc-title); color: var(--mc-title); }
    #_mc_cpy.ok    { border-color: #22cc66; color: #22cc66; }
    #_mc_clr:hover { border-color: #ff6b6b; color: #ff6b6b; }

    /* ── JS-ввод ── */
    #_mc_js_row {
      display: none; align-items: center; gap: 5px;
      padding: 4px 8px;
      border-top: 1px solid var(--mc-border2);
      background: var(--mc-bg2);
      transition: background .25s, border-color .25s;
    }
    #_mc_js_row.open { display: flex; }

    #_mc_js_prompt {
      color: #e8b400; font-size: 13px; flex-shrink: 0;
      font-family: 'JetBrains Mono',monospace;
    }
    #_mc_js_input {
      flex: 1; min-width: 0;
      background: var(--mc-inp-bg);
      border: 1px solid var(--mc-btn-brd);
      border-radius: 3px; color: var(--mc-inp-txt);
      font: 12px/1.4 'JetBrains Mono',monospace;
      padding: 3px 6px; outline: none;
      caret-color: #e8b400;
      transition: background .25s, color .25s, border-color .15s;
    }
    #_mc_js_input:focus { border-color: #e8b400; }
    #_mc_js_run {
      flex-shrink: 0; padding: 3px 7px;
      background: transparent; border: 1px solid #e8b400;
      border-radius: 3px; color: #e8b400;
      cursor: pointer; display: inline-flex; align-items: center;
      transition: background .15s;
    }
    #_mc_js_run:hover { background: rgba(232,180,0,.15); }

    /* ── лог ── */
    #_mc_log {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 4px 8px; -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }
    .mc-line {
      display: flex; gap: 6px; padding: 3px 0;
      border-bottom: 1px solid var(--mc-log-sep);
      word-break: break-all; user-select: text;
    }
    .mc-line:last-child { border-bottom: none; }
    .mc-line.hidden { display: none; }
    .mc-ts  { color: var(--mc-ts); flex-shrink: 0; white-space: nowrap; transition: color .25s; }
    .mc-tag { flex-shrink: 0; }
    .mc-txt { flex: 1; min-width: 0; }

    /* цвета текста лога одинаковы в обеих темах — они и так контрастные */
    .mc-line.t-log   .mc-txt { color: #00aa55; }
    .mc-line.t-warn  .mc-txt { color: #cc8800; }
    .mc-line.t-error .mc-txt { color: #dd4444; }
    .mc-line.t-net   .mc-txt { color: #2299cc; }
    .mc-line.t-click .mc-txt { color: #9966cc; }
    .mc-line.t-ls    .mc-txt { color: #229988; }
    .mc-line.t-jsin  .mc-txt { color: #cc8800; }
    .mc-line.t-jsout .mc-txt { color: var(--mc-inp-txt); }
    .mc-line.t-jserr .mc-txt { color: #dd4444; }

    /* светлая тема — немного ярче для лога */
    #_mc_wrap.mc-light .mc-line.t-log   .mc-txt { color: #007733; }
    #_mc_wrap.mc-light .mc-line.t-net   .mc-txt { color: #005fa3; }
    #_mc_wrap.mc-light .mc-line.t-click .mc-txt { color: #6633aa; }

    /* ── кнопка открытия ── */
    #_mc_btn {
      position: fixed; left: 3px; bottom: 3px;
      z-index: 2147483647;
      width: 28px; height: 28px;
      margin: 0; padding: 0; border: none; background: none;
      color: #888;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: color .25s;
    }
    #_mc_btn.open { color: #00aacc; }

    /* ── бейдж ошибок ── */
    #_mc_badge {
      position: fixed; bottom: 22px; left: 16px;
      background: #dd4444; color: #fff;
      font: bold 9px/14px sans-serif;
      min-width: 14px; height: 14px;
      border-radius: 7px; padding: 0 3px;
      text-align: center; display: none;
      pointer-events: none; box-sizing: border-box;
      z-index: 2147483647;
    }
  `;
  document.head.appendChild(style);

  /* ─── DOM ─── */
  const wrap = document.createElement('div');
  wrap.id = '_mc_wrap';
  wrap.innerHTML = `
    <div id="_mc_resize"></div>
    <div id="_mc_toolbar">
      <div id="_mc_row1">
        <span id="_mc_title">console v2.7</span>
        <button id="_mc_f_all" class="active">ALL</button>
        <button id="_mc_f_click">CLICK</button>
        <button id="_mc_f_ls">LS</button>
        <button id="_mc_js_btn" title="JS ввод">${ICO_JS} JS</button>
        <button id="_mc_cpy" title="Копировать">${ICO_COPY}</button>
        <button id="_mc_clr" title="Очистить">${ICO_TRASH}</button>
      </div>
      <div id="_mc_js_row">
        <span id="_mc_js_prompt">&gt;</span>
        <input id="_mc_js_input" type="text" placeholder="JS выражение…"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
        <button id="_mc_js_run">${ICO_RUN}</button>
      </div>
    </div>
    <div id="_mc_log"></div>`;

  const toggleBtn = document.createElement('button');
  toggleBtn.id = '_mc_btn';
  toggleBtn.title = 'Console';
  toggleBtn.innerHTML = ICO_CON + `<span id="_mc_badge"></span>`;

  document.body.appendChild(wrap);
  document.body.appendChild(toggleBtn);

  const logEl     = document.getElementById('_mc_log');
  const fAllBtn   = document.getElementById('_mc_f_all');
  const fClickBtn = document.getElementById('_mc_f_click');
  const fLsBtn    = document.getElementById('_mc_f_ls');
  const jsBtn     = document.getElementById('_mc_js_btn');
  const jsRow     = document.getElementById('_mc_js_row');
  const jsInput   = document.getElementById('_mc_js_input');
  const jsRun     = document.getElementById('_mc_js_run');
  const clrBtn    = document.getElementById('_mc_clr');
  const cpyBtn    = document.getElementById('_mc_cpy');
  const resizer   = document.getElementById('_mc_resize');
  const badge     = document.getElementById('_mc_badge');

  const filterBtns = [fAllBtn, fClickBtn, fLsBtn];

  /* ══════════════════════════════════════════════
     АВТО-ТЕМА: определяем светлость фона страницы
     и переключаем класс .mc-light на консоли.
     Работает с любой реализацией темы —
     через класс, data-атрибут, CSS-переменную,
     или прямой стиль.
     ══════════════════════════════════════════════ */
  function parseBrightness(color) {
    // разбираем rgb(r,g,b) или rgba(r,g,b,a)
    const m = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return 0;
    // формула яркости (перцептивная)
    return (parseInt(m[1]) * 299 + parseInt(m[2]) * 587 + parseInt(m[3]) * 114) / 1000;
  }

  function detectTheme() {
    // Читаем фактический вычисленный фон body
    const bg = getComputedStyle(document.body).backgroundColor;
    const brightness = parseBrightness(bg);
    // > 128 — светлый фон → светлая тема консоли
    // rgba(0,0,0,0) = прозрачный (нет фона) → считаем тёмным
    const isLight = brightness > 128;
    wrap.classList.toggle('mc-light', isLight);
    toggleBtn.style.color = isLight ? '#555' : '#888';
  }

  // Запускаем сразу после добавления в DOM
  // (ждём один тик, чтобы страница успела применить свои стили)
  setTimeout(detectTheme, 0);

  // Следим за изменениями на <body>: class, style, data-*
  new MutationObserver(detectTheme).observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme']
  });

  // Также ловим изменения на <html> (некоторые сайты ставят тему там)
  new MutationObserver(detectTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme', 'color-scheme']
  });

  /* ─── УТИЛИТЫ ─── */
  function ts() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, '0')).join(':');
  }

  function serialize(a) {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object' && a !== null) {
      try { return JSON.stringify(a, null, 0); } catch { return String(a); }
    }
    return String(a);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updateBadge() {
    badge.textContent = errorCount > 99 ? '99+' : errorCount;
    badge.style.display = errorCount > 0 ? 'block' : 'none';
  }

  function isVisible(type) {
    if (filter === 'ALL') return type !== 'ls';
    return type === filter;
  }

  function setFilter(f, btn) {
    filter = f;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter();
  }

  function applyFilter() {
    lines.forEach(({ type, el }) => {
      el.classList.toggle('hidden', !isVisible(type));
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  function addLine(type, tag, text) {
    if (lines.length >= MAX_LINES) {
      const removed = lines.shift();
      if (removed.type === 'error' || removed.type === 'warn') {
        errorCount = Math.max(0, errorCount - 1);
        updateBadge();
      }
      removed.el.remove();
    }
    if ((type === 'error' || type === 'warn') && !wrap.classList.contains('open')) {
      errorCount++;
      updateBadge();
    }
    const div = document.createElement('div');
    div.className = `mc-line t-${type}`;
    if (!isVisible(type)) div.classList.add('hidden');
    div.innerHTML =
      `<span class="mc-ts">[${ts()}]</span>` +
      `<span class="mc-tag">${tag}</span>` +
      `<span class="mc-txt">${esc(text)}</span>`;
    logEl.appendChild(div);
    if (isVisible(type)) logEl.scrollTop = logEl.scrollHeight;
    lines.push({ type, el: div });
  }

  /* ─── console.log / warn / error ─── */
  function patchConsole(method, type, tag) {
    const orig = console[method];
    console[method] = function (...args) {
      orig.apply(console, args);
      addLine(type, tag, args.map(serialize).join(' '));
    };
  }
  patchConsole('log',   'log',   '📋');
  patchConsole('warn',  'warn',  '⚠️');
  patchConsole('error', 'error', '🔴');

  /* ─── Глобальные ошибки ─── */
  window.addEventListener('error', e => {
    const loc = e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : '';
    console.error(e.message + loc);
  });
  window.addEventListener('unhandledrejection', e => {
    console.error('Promise: ' + serialize(e.reason));
  });

  /* ─── Клики, чекбоксы, радио ─── */
  document.addEventListener('click', e => {
    if (wrap.contains(e.target) || toggleBtn.contains(e.target)) return;
    const el = e.target.closest(
      'button, a, input[type=submit], input[type=button],' +
      'input[type=checkbox], input[type=radio], [data-log]'
    );
    if (!el) return;
    let label;
    if (el.type === 'checkbox') {
      label = `${el.checked ? '☑' : '☐'} ${el.name || el.id || 'checkbox'}`;
    } else if (el.type === 'radio') {
      label = `◉ ${el.name || el.id || 'radio'} = ${el.value}`;
    } else {
      label = el.dataset.log
        || el.textContent.trim().slice(0, 40)
        || el.getAttribute('aria-label')
        || el.name || el.value || '?';
    }
    const sel = (el.id
      ? `#${el.id}`
      : el.classList.length
        ? `.${[...el.classList].slice(0, 2).join('.')}`
        : el.tagName.toLowerCase()
    ).slice(0, 30);
    addLine('click', '🖱', `"${label}" [${sel}]`);
  });

  /* ─── fetch ─── */
  const _fetch = window.fetch;
  window.fetch = function (resource, init) {
    const url    = (typeof resource === 'string' ? resource : resource.url)
                     .replace(location.origin, '').slice(0, 60);
    const method = ((init && init.method) || 'GET').toUpperCase();
    const t0     = Date.now();
    addLine('net', '🌐', `${method} ${url} …`);
    return _fetch.apply(this, arguments)
      .then(res => {
        addLine('net', '🌐', `${method} ${url} → ${res.status} (${Date.now() - t0}ms)`);
        return res;
      })
      .catch(err => {
        addLine('net', '🌐', `${method} ${url} ✗ ${err.message}`);
        throw err;
      });
  };

  /* ─── XHR ─── */
  const _XHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const xhr = new _XHR();
    let _m, _u, _t0;
    const origOpen = xhr.open.bind(xhr);
    xhr.open = (m, u, ...r) => {
      _m = m.toUpperCase(); _u = String(u).replace(location.origin,'').slice(0,60);
      return origOpen(m, u, ...r);
    };
    xhr.addEventListener('loadstart', () => { _t0 = Date.now(); addLine('net','🌐',`${_m} ${_u} …`); });
    xhr.addEventListener('load',  () => addLine('net','🌐',`${_m} ${_u} → ${xhr.status} (${Date.now()-_t0}ms)`));
    xhr.addEventListener('error', () => addLine('net','🌐',`${_m} ${_u} ✗ network error`));
    return xhr;
  };
  window.XMLHttpRequest.prototype = _XHR.prototype;

  /* ─── Фильтры ─── */
  fAllBtn.addEventListener('click',   () => setFilter('ALL',   fAllBtn));
  fClickBtn.addEventListener('click', () => setFilter('click', fClickBtn));

  /* ─── LS ─── */
  fLsBtn.addEventListener('click', () => {
    const wasActive = filter === 'ls';
    if (!wasActive) {
      const keys = Object.keys(localStorage);
      addLine('ls', '💾', `─── localStorage (${keys.length}) ───`);
      if (!keys.length) {
        addLine('ls', '  ', 'пусто');
      } else {
        keys.forEach(k => {
          let v = localStorage.getItem(k);
          if (v && v.length > 80) v = v.slice(0, 80) + '…';
          addLine('ls', '  ', `${k} = ${v}`);
        });
      }
    }
    setFilter(wasActive ? 'ALL' : 'ls', wasActive ? fAllBtn : fLsBtn);
  });

  /* ─── JS кнопка-тоггл ─── */
  jsBtn.addEventListener('click', () => {
    const open = jsRow.classList.toggle('open');
    jsBtn.classList.toggle('active', open);
    if (open) { jsInput.focus(); jsHistIdx = -1; }
  });

  /* ─── Выполнить JS ─── */
  function runJS() {
    const code = jsInput.value.trim();
    if (!code) return;
    jsHistory.unshift(code);
    if (jsHistory.length > 50) jsHistory.pop();
    jsHistIdx = -1;
    addLine('jsin', '›', code);
    jsInput.value = '';
    try {
      // eslint-disable-next-line no-eval
      const result = (0, eval)(code);
      if (result !== undefined) addLine('jsout', '←', serialize(result));
    } catch (e) {
      addLine('jserr', '✗', e.message);
    }
  }

  jsRun.addEventListener('click', runJS);
  jsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault(); runJS();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (jsHistIdx < jsHistory.length - 1) jsInput.value = jsHistory[++jsHistIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      jsInput.value = jsHistIdx > 0 ? jsHistory[--jsHistIdx] : (jsHistIdx = -1, '');
    }
  });

  /* ─── Копировать ─── */
  cpyBtn.addEventListener('click', () => {
    const text = lines
      .filter(({ el }) => !el.classList.contains('hidden'))
      .map(({ el }) => {
        const t = el.querySelector('.mc-ts')?.textContent  || '';
        const g = el.querySelector('.mc-tag')?.textContent || '';
        const x = el.querySelector('.mc-txt')?.textContent || '';
        return `${t} ${g} ${x}`.trim();
      })
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      cpyBtn.innerHTML = ICO_CHECK;
      cpyBtn.classList.add('ok');
      setTimeout(() => { cpyBtn.innerHTML = ICO_COPY; cpyBtn.classList.remove('ok'); }, 1500);
    }).catch(() => {
      cpyBtn.innerHTML = '✗';
      setTimeout(() => { cpyBtn.innerHTML = ICO_COPY; }, 1500);
    });
  });

  /* ─── Очистка ─── */
  clrBtn.addEventListener('click', () => {
    logEl.innerHTML = '';
    lines = [];
    errorCount = 0;
    updateBadge();
  });

  /* ─── Resize ─── */
  let resizing = false, startY = 0, startH = 0;
  resizer.addEventListener('pointerdown', e => {
    e.preventDefault(); resizing = true;
    startY = e.clientY; startH = wrap.offsetHeight;
    resizer.setPointerCapture(e.pointerId);
  });
  resizer.addEventListener('pointermove', e => {
    if (!resizing) return;
    e.preventDefault();
    const h = Math.max(50, Math.min(window.innerHeight * 0.75,
      startH - (e.clientY - startY)));
    wrap.style.height = h + 'px';
    toggleBtn.style.bottom = (h + 4) + 'px';
  });
  resizer.addEventListener('pointerup',     () => { resizing = false; });
  resizer.addEventListener('pointercancel', () => { resizing = false; });

  /* ─── Открыть / закрыть ─── */
  toggleBtn.addEventListener('click', () => {
    const open = wrap.classList.toggle('open');
    toggleBtn.classList.toggle('open', open);
    toggleBtn.style.bottom = open ? (wrap.offsetHeight + 4) + 'px' : '3px';
    if (open) {
      logEl.scrollTop = logEl.scrollHeight;
      errorCount = 0;
      updateBadge();
    }
  });

  console.log('mobile console v2.7 ready');

})();