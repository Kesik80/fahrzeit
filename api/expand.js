// /api/expand.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Параметр "url" обязателен' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const decodedUrl = decodeURIComponent(url);

    try { new URL(decodedUrl); }
    catch { return res.status(400).json({ error: 'Некорректный URL' }); }

    const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

    // ── Шаг 1: HEAD для быстрого редиректа ──────────────────────────────
    let expandedUrl = decodedUrl;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(decodedUrl, {
        method: 'HEAD', redirect: 'follow',
        signal: ctrl.signal, headers: { 'User-Agent': UA }
      });
      clearTimeout(t);
      expandedUrl = r.url;
    } catch { /* продолжаем с GET */ }

    // Если координаты уже в URL — возвращаем сразу
    if (extractCoordsFromUrl(expandedUrl)) {
      return res.status(200).json({ original: url, expanded: expandedUrl });
    }

    // ── Шаг 2: GET + парсинг HTML ────────────────────────────────────────
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 10000);
    const getResp = await fetch(decodedUrl, {
      method: 'GET', redirect: 'follow',
      signal: ctrl2.signal,
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    clearTimeout(t2);

    const finalUrl = getResp.url;

    // Координаты в финальном URL после GET (часто там уже есть @lat,lng)
    if (extractCoordsFromUrl(finalUrl)) {
      return res.status(200).json({ original: url, expanded: finalUrl });
    }

    // Парсим HTML
    const html = await getResp.text();
    const coords = extractCoordsFromHtml(html);

    if (coords) {
      const mapsUrl = `https://www.google.com/maps/@${coords.lat},${coords.lng},17z`;
      return res.status(200).json({ original: url, expanded: mapsUrl });
    }

    // Ничего не нашли — отдаём финальный URL как есть
    return res.status(200).json({ original: url, expanded: finalUrl });

  } catch (err) {
    console.error('Expand error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(500).json({ error: 'Таймаут при раскрытии ссылки' });
    }
    res.status(500).json({ error: 'Не удалось раскрыть ссылку', details: err.message });
  }
}

// ── Парсинг координат из URL ─────────────────────────────────────────────────
function extractCoordsFromUrl(url) {
  if (!url) return null;
  // @51.452013,7.021455,17z
  let m = url.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };
  // ll=51.452,7.021
  m = url.match(/[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };
  // q=51.452,7.021
  m = url.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };
  return null;
}

// ── Парсинг координат из HTML ────────────────────────────────────────────────
function extractCoordsFromHtml(html) {
  if (!html) return null;

  // 1. og:url / canonical
  for (const pattern of [
    /property="og:url"\s+content="([^"]+)"/,
    /content="([^"]+)"\s+property="og:url"/,
    /rel="canonical"\s+href="([^"]+)"/,
    /href="([^"]+)"\s+rel="canonical"/,
  ]) {
    const m = html.match(pattern);
    if (m) {
      const c = extractCoordsFromUrl(m[1]);
      if (c) return c;
    }
  }

  // 2. JSON-массивы [lat, lng] с высокой точностью
  const jsonCoords = html.match(/\[(-?\d{2,3}\.\d{5,}),(-?\d{1,3}\.\d{5,})\]/g);
  if (jsonCoords) {
    for (const pair of jsonCoords) {
      const m = pair.match(/\[(-?\d{2,3}\.\d{5,}),(-?\d{1,3}\.\d{5,})\]/);
      if (m) {
        const lat = +m[1], lng = +m[2];
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
  }

  // 3. JSON-поля "lat" / "lng"
  const mLat = html.match(/"lat"\s*:\s*(-?\d{1,3}\.\d+)/);
  const mLng = html.match(/"lng"\s*:\s*(-?\d{1,3}\.\d+)/);
  if (mLat && mLng) return { lat: +mLat[1], lng: +mLng[1] };

  // 4. itemprop latitude/longitude
  const iLat = html.match(/itemprop="latitude"\s+content="(-?\d+\.\d+)"/);
  const iLng = html.match(/itemprop="longitude"\s+content="(-?\d+\.\d+)"/);
  if (iLat && iLng) return { lat: +iLat[1], lng: +iLng[1] };

  return null;
}
