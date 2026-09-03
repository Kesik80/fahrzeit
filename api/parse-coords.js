// /api/parse-coords.js — Vercel Serverless Function
//
// Задача: из чего угодно (координаты, длинная ссылка Google Maps,
// короткая maps.app.goo.gl, Apple Maps, OSM) получить ОДНУ точку.
//
// Главное изменение против прошлой версии:
//   раньше побеждал первый попавшийся шаблон, и для коротких ссылок
//   обычно срабатывал «@lat,lng» — а это ЦЕНТР КАРТЫ, а не сама метка.
//   Точка уезжала на десятки метров, иногда на другую сторону улицы.
//   Теперь у каждого шаблона есть приоритет: сначала ищем метку объекта
//   (!3d!4d), потом цель маршрута, и только в самом конце — центр карты,
//   и такой ответ помечается флагом approx:true, чтобы редактор подсветил
//   поле оранжевым и попросил проверить.

const https = require('https');
const http  = require('http');

const MAX_BODY = 700000;   // сколько байт страницы читаем максимум
const TIMEOUT  = 10000;    // таймаут одного запроса, мс

// ── Шаблоны поиска координат. rank: меньше = точнее ────────────────────────
const PATTERNS = [
  { rank: 1, name: 'marker',      re: /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/ },
  { rank: 1, name: 'json-latlng', re: /"lat"\s*:\s*(-?\d+\.\d+)\s*,\s*"lng"\s*:\s*(-?\d+\.\d+)/ },
  { rank: 2, name: 'destination', re: /[?&](?:daddr|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i },
  { rank: 2, name: 'query',       re: /[?&](?:q|query|dest)=(?:loc:)?(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i },
  { rank: 2, name: 'll',          re: /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/ },
  { rank: 2, name: 'osm-marker',  re: /[?&]mlat=(-?\d+\.\d+)[^#]*?[?&]mlon=(-?\d+\.\d+)/ },
  { rank: 2, name: 'place-path',  re: /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/ },
  { rank: 2, name: 'geo-uri',     re: /^geo:(-?\d+\.\d+),(-?\d+\.\d+)/i },
  { rank: 2, name: 'itemprop',    re: /itemprop="latitude"\s+content="(-?\d+\.\d+)"[\s\S]{0,200}?itemprop="longitude"\s+content="(-?\d+\.\d+)"/ },
  // Ниже — приблизительные: это положение камеры, а не объект
  { rank: 5, name: 'map-center',  re: /@(-?\d+\.\d+),(-?\d+\.\d+)/,               approx: true },
  { rank: 5, name: 'center-param',re: /[?&]center=(-?\d+\.\d+),(-?\d+\.\d+)/,     approx: true },
  { rank: 5, name: 'osm-hash',    re: /#map=\d+(?:\.\d+)?\/(-?\d+\.\d+)\/(-?\d+\.\d+)/, approx: true }
];

const inRange = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

// Ищем в строке лучший (самый точный) вариант, а не первый попавшийся
function bestMatch(str, maxRank = 99) {
  if (!str) return null;
  const variants = [str];
  try { const d = decodeURIComponent(str); if (d !== str) variants.push(d); } catch {}

  let best = null;
  for (const p of PATTERNS) {
    if (p.rank > maxRank) continue;
    if (best && best.rank <= p.rank) continue;   // уже есть не хуже
    for (const v of variants) {
      const m = v.match(p.re);
      if (!m) continue;
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (!inRange(lat, lng)) continue;
      best = { lat, lng, rank: p.rank, source: p.name, approx: !!p.approx };
      break;
    }
    if (best && best.rank === 1) break;          // точнее уже не будет
  }
  return best;
}

// Отдельно — пары координат прямо в теле страницы ([51.123456,6.123456])
function pairsFromBody(body) {
  const re = /\[(-?\d{1,3}\.\d{6,}),(-?\d{1,3}\.\d{6,})\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (inRange(lat, lng)) return { lat, lng, rank: 3, source: 'body-pair', approx: false };
  }
  return null;
}

// ── Загрузка страницы с ручной обработкой редиректов ──────────────────────
function fetchUrl(url, redirectCount = 0, chain = []) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error('Слишком много редиректов'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
      timeout: TIMEOUT
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        chain.push(next);
        // ВАЖНО: раньше здесь принимался любой найденный шаблон, включая @center.
        // Теперь по редиректу принимаем только точную метку (rank 1) —
        // во всех остальных случаях дочитываем страницу до конца.
        const exact = bestMatch(next, 1);
        if (exact) return resolve({ finalUrl: next, body: '', coords: exact, chain });
        return resolve(fetchUrl(next, redirectCount + 1, chain));
      }
      let body = '';
      res.on('data', chunk => { if (body.length < MAX_BODY) body += chunk; });
      res.on('end', () => resolve({ finalUrl: url, body, status: res.statusCode, chain }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Текстовые форматы: 51.5, 6.8 / 51,5, 6,8 / градусы ────────────────────
function parseText(s) {
  // Немецкая запись через запятую: 51,530133, 6,850858
  let m = s.match(/^(-?\d{1,2}),(\d+)\s*[;,]\s*(-?\d{1,3}),(\d+)$/);
  if (m) {
    const lat = parseFloat(`${m[1]}.${m[2]}`), lng = parseFloat(`${m[3]}.${m[4]}`);
    if (inRange(lat, lng)) return { lat, lng, source: 'text-de' };
  }
  // Обычная запись: 51.530133, 6.850858 (также через пробел или ;)
  m = s.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (m) {
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (inRange(lat, lng)) return { lat, lng, source: 'text' };
  }
  // Градусы-минуты-секунды: 51°31'48.5"N 6°51'03.1"E
  const dms = [...s.matchAll(/(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:[.,]\d+)?)["″]?\s*([NSEWO])/gi)];
  if (dms.length === 2) {
    const toDec = ([, d, mi, sec, dir]) => {
      let v = +d + +mi / 60 + parseFloat(String(sec).replace(',', '.')) / 3600;
      if (/[SW]/i.test(dir)) v = -v;
      return v;
    };
    const lat = toDec(dms[0]), lng = toDec(dms[1]);
    if (inRange(lat, lng)) return { lat, lng, source: 'dms' };
  }
  return null;
}

// ── Геокодирование по названию места из URL (последняя надежда) ───────────
function nominatim(query) {
  return new Promise(resolve => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    https.get(url, { headers: { 'User-Agent': 'FahrzeitRechner/1.0' }, timeout: TIMEOUT }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(body);
          if (d && d[0]) {
            const lat = parseFloat(d[0].lat), lng = parseFloat(d[0].lon);
            return resolve(inRange(lat, lng) ? { lat, lng } : null);
          }
        } catch {}
        resolve(null);
      });
    }).on('error', () => resolve(null)).on('timeout', function () { this.destroy(); resolve(null); });
  });
}

async function geocodeFromUrl(url) {
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch {}
  decoded = decoded.replace(/\+/g, ' ');
  const placeMatch = decoded.match(/\/maps\/place\/([^/@]+)/);
  if (!placeMatch) return null;

  const full = placeMatch[1].trim();
  const parts = full.split(',').map(s => s.trim()).filter(Boolean);
  const queries = [full];
  if (parts.length >= 2) queries.push(parts.slice(-2).join(', '));
  if (parts.length >= 1) queries.push(parts[parts.length - 1]);

  for (const q of queries) {
    const r = await nominatim(q);
    if (r) return r;
  }
  return null;
}

// ── HTTP-обработчик ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const input = (
    req.method === 'POST' ? (await getBody(req)).input : req.query.input
  )?.trim();

  if (!input) {
    return res.status(400).json({ success: false, error: 'Параметр input обязателен' });
  }

  const reply = c => res.json({
    success: true,
    // округляем до 6 знаков прямо здесь — редактор хранит именно столько
    lat: Math.round(c.lat * 1e6) / 1e6,
    lng: Math.round(c.lng * 1e6) / 1e6,
    source: c.source,
    approx: !!c.approx
  });

  try {
    // 1. Не ссылка — разбираем как текст
    if (!/^(https?:\/\/|geo:)/i.test(input)) {
      const coords = parseText(input);
      if (coords) return reply(coords);
      return res.status(422).json({ success: false, error: 'Координаты не распознаны' });
    }

    // 2. geo: обрабатывается без сети
    if (/^geo:/i.test(input)) {
      const g = bestMatch(input);
      if (g) return reply(g);
    }

    // 3. Сначала пробуем саму ссылку — но принимаем только точный результат
    const direct = bestMatch(input, 2);
    if (direct) return reply(direct);

    // 4. Раскрываем короткую ссылку / читаем страницу
    const result = await fetchUrl(input);

    const candidates = [];
    if (result.coords) candidates.push(result.coords);
    const fromFinalUrl = bestMatch(result.finalUrl);
    if (fromFinalUrl) candidates.push(fromFinalUrl);
    const fromBody = bestMatch(result.body);
    if (fromBody) candidates.push(fromBody);
    const fromPairs = pairsFromBody(result.body);
    if (fromPairs) candidates.push(fromPairs);

    if (candidates.length) {
      // Берём самый точный из всех найденных, а не первый встретившийся
      candidates.sort((a, b) => a.rank - b.rank);
      return reply(candidates[0]);
    }

    // 5. Совсем ничего — геокодируем по названию места из адреса
    const fromGeo = await geocodeFromUrl(result.finalUrl);
    if (fromGeo) return reply({ ...fromGeo, source: 'geocode', approx: true });

    return res.status(422).json({ success: false, error: 'Координаты не найдены в ссылке' });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

function getBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}
