// /api/parse-coords.js — Vercel Serverless Function
const https = require('https');
const http  = require('http');

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error('Слишком много редиректов'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
      timeout: 10000
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        const fromRedirect = parseCoords(next);
        if (fromRedirect) return resolve({ finalUrl: next, body: '', coords: fromRedirect });
        return resolve(fetchUrl(next, redirectCount + 1));
      }
      let body = '';
      res.on('data', chunk => { if (body.length < 500000) body += chunk; });
      res.on('end', () => resolve({ finalUrl: url, body, status: res.statusCode }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseCoords(str) {
  const check = (lat, lng) =>
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
  let m;

  // !3d<lat>!4d<lng>
  m = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return check(+m[1], +m[2]);

  // @lat,lng
  m = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return check(+m[1], +m[2]);

  // ll=lat,lng
  m = str.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return check(+m[1], +m[2]);

  // /place/lat,lng
  m = str.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return check(+m[1], +m[2]);

  // ?q= / ?query= / ?center= / ?dest=
  m = str.match(/[?&](?:q|query|center|dest)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return check(+m[1], +m[2]);

  // Просто два числа рядом
  m = str.match(/([-+]?\d{1,3}\.\d{4,})[\s,]+([-+]?\d{1,3}\.\d{4,})/);
  if (m) return check(+m[1], +m[2]);

  return null;
}

// Геокодирование через адрес в URL (когда координат нет напрямую)
async function geocodeFromUrl(url) {
  // Извлекаем название места из URL вида /maps/place/NAME/data=...
  const placeMatch = decodeURIComponent(url).match(/\/maps\/place\/([^/]+)\//);
  if (!placeMatch) return null;
  
  const placeName = placeMatch[1].replace(/\+/g, ' ');
  
  // Используем Nominatim OpenStreetMap для геокодирования
  return new Promise((resolve) => {
    const q = encodeURIComponent(placeName);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    https.get(nominatimUrl, {
      headers: { 'User-Agent': 'FahrzeitRechner/1.0' }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              resolve({ lat, lng });
            } else resolve(null);
          } else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function parseText(s) {
  if (/^-?\d{1,2},\d+\s*,\s*-?\d{1,3},\d+$/.test(s)) {
    const p = s.split(',').map(t => t.trim());
    const lat = parseFloat(p[0] + '.' + p[1]);
    const lng = parseFloat(p[2] + '.' + p[3]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  if (/^-?\d{1,2}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(s)) {
    const [lat, lng] = s.split(',').map(Number);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  const dms = [...s.matchAll(/(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])/gi)];
  if (dms.length === 2) {
    const toDec = ([, d, m, sec, dir]) => {
      let v = +d + +m / 60 + +sec / 3600;
      if (/[SW]/i.test(dir)) v = -v;
      return v;
    };
    const lat = toDec(dms[0]), lng = toDec(dms[1]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

function parseCoordsFromBody(body) {
  let m;

  m = body.match(/"lat"\s*:\s*([-+]?\d+\.\d+)\s*,\s*"lng"\s*:\s*([-+]?\d+\.\d+)/);
  if (m && Math.abs(+m[1]) <= 90) return { lat: +m[1], lng: +m[2] };

  for (const pattern of [
    /property="og:url"\s+content="([^"]+)"/,
    /content="([^"]+)"\s+property="og:url"/,
    /rel="canonical"\s+href="([^"]+)"/,
  ]) {
    m = body.match(pattern);
    if (m) {
      const c = parseCoords(decodeURIComponent(m[1]));
      if (c) return c;
    }
  }

  m = body.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m && Math.abs(+m[1]) <= 90) return { lat: +m[1], lng: +m[2] };

  const pairs = body.match(/\[([-+]?\d{2,3}\.\d{6,}),([-+]?\d{1,3}\.\d{6,})\]/g);
  if (pairs) {
    for (const pair of pairs) {
      m = pair.match(/\[([-+]?\d{2,3}\.\d{6,}),([-+]?\d{1,3}\.\d{6,})\]/);
      if (m) {
        const lat = +m[1], lng = +m[2];
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
      }
    }
  }

  const iLat = body.match(/itemprop="latitude"\s+content="([-+]?\d+\.\d+)"/);
  const iLng = body.match(/itemprop="longitude"\s+content="([-+]?\d+\.\d+)"/);
  if (iLat && iLng) return { lat: +iLat[1], lng: +iLng[1] };

  m = body.match(/([-+]?\d{1,3}\.\d{5,}),\s*([-+]?\d{1,3}\.\d{5,})/);
  if (m && Math.abs(+m[1]) <= 90) return { lat: +m[1], lng: +m[2] };

  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.setHeader('Content-Type', 'application/json');

  const input = (
    req.method === 'POST' ? (await getBody(req)).input : req.query.input
  )?.trim();

  if (!input) {
    return res.status(400).json({ success: false, error: 'Параметр input обязателен' });
  }

  try {
    if (!/^https?:\/\//i.test(input)) {
      const coords = parseText(input);
      if (coords) return res.json({ success: true, ...coords });
      return res.status(422).json({ success: false, error: 'Координаты не распознаны' });
    }

    const result = await fetchUrl(input);

    if (result.coords) return res.json({ success: true, ...result.coords, source: 'redirect' });

    const finalUrl = result.finalUrl;
    const body = result.body;

    // Из финального URL
    const fromUrl = parseCoords(finalUrl) || parseCoords(decodeURIComponent(finalUrl));
    if (fromUrl) return res.json({ success: true, ...fromUrl, source: 'url' });

    // Из тела страницы
    const fromBody = parseCoordsFromBody(body);
    if (fromBody) return res.json({ success: true, ...fromBody, source: 'body' });

    // Геокодирование через название места из URL (Nominatim)
    const fromGeo = await geocodeFromUrl(finalUrl);
    if (fromGeo) return res.json({ success: true, ...fromGeo, source: 'geocode' });

    return res.status(422).json({ success: false, error: 'Координаты не найдены в ссылке' });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}
