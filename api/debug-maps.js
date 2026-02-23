// /api/debug-maps.js — ВРЕМЕННЫЙ файл для диагностики, удалить после отладки
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
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      timeout: 10000
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        return resolve(fetchUrl(next, redirectCount + 1));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ finalUrl: url, body, status: res.statusCode }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const result = await fetchUrl(decodeURIComponent(url));

    // Ищем все паттерны координат в body
    const body = result.body;
    const findings = {
      finalUrl: result.finalUrl,
      status: result.status,
      bodyLength: body.length,
      // Первые 500 символов тела
      bodyStart: body.substring(0, 500),
      // Ищем @lat,lng в финальном URL
      atCoords: result.finalUrl.match(/@([-+]?\d+\.\d+),([-+]?\d+\.\d+)/)?.[0] || null,
      // og:url
      ogUrl: body.match(/property="og:url"\s+content="([^"]+)"/)?.[1] || 
             body.match(/content="([^"]+)"\s+property="og:url"/)?.[1] || null,
      // canonical
      canonical: body.match(/rel="canonical"\s+href="([^"]+)"/)?.[1] || null,
      // JSON массивы с высокой точностью [lat, lng]
      jsonPairs: (body.match(/\[([-+]?\d{2,3}\.\d{6,}),([-+]?\d{1,3}\.\d{6,})\]/g) || []).slice(0, 5),
      // itemprop
      itempropLat: body.match(/itemprop="latitude"\s+content="([^"]+)"/)?.[1] || null,
      itempropLng: body.match(/itemprop="longitude"\s+content="([^"]+)"/)?.[1] || null,
      // Любые пары чисел 5+ знаков
      anyCoords: (body.match(/([-+]?\d{2}\.\d{5,}),([-+]?\d{1,2}\.\d{5,})/g) || []).slice(0, 5),
    };

    res.json(findings);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
