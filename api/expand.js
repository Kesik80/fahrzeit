// /api/expand.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Параметр "url" обязателен' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const decodedUrl = decodeURIComponent(url);

    try {
      new URL(decodedUrl);
    } catch {
      return res.status(400).json({ error: 'Некорректный URL' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Шаг 1: HEAD-запрос для получения первого редиректа
    const headResponse = await fetch(decodedUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
      }
    });

    clearTimeout(timeout);

    const expandedUrl = headResponse.url;

    // Шаг 2: Пробуем извлечь координаты из URL редиректа
    const coordsFromUrl = extractCoordsFromUrl(expandedUrl);
    if (coordsFromUrl) {
      return res.status(200).json({
        original: url,
        expanded: expandedUrl,
        status: headResponse.status
      });
    }

    // Шаг 3: Если координат нет в URL (maps.app.goo.gl отдаёт URL без @lat,lng),
    // делаем GET и парсим HTML — там координаты есть в meta/og:title или в теле страницы
    if (isMapsAppGooGl(decodedUrl) || isMapsAppGooGl(expandedUrl)) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 10000);

      const getResponse = await fetch(decodedUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller2.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
          'Accept-Language': 'de-DE,de;q=0.9'
        }
      });

      clearTimeout(timeout2);

      const finalUrl = getResponse.url;
      const html = await getResponse.text();

      // Ищем координаты в финальном URL после GET
      const coordsFromFinalUrl = extractCoordsFromUrl(finalUrl);
      if (coordsFromFinalUrl) {
        return res.status(200).json({
          original: url,
          expanded: finalUrl,
          status: getResponse.status
        });
      }

      // Ищем координаты в HTML: window.APP_INITIALIZATION_STATE, og:url, canonical
      const coordsFromHtml = extractCoordsFromHtml(html);
      if (coordsFromHtml) {
        // Строим нормальный maps URL с координатами
        const mapsUrl = `https://www.google.com/maps/@${coordsFromHtml.lat},${coordsFromHtml.lng},17z`;
        return res.status(200).json({
          original: url,
          expanded: mapsUrl,
          status: getResponse.status
        });
      }

      // Отдаём финальный URL как есть — parseCoords на клиенте попробует ещё раз
      return res.status(200).json({
        original: url,
        expanded: finalUrl,
        status: getResponse.status
      });
    }

    return res.status(200).json({
      original: url,
      expanded: expandedUrl,
      status: headResponse.status
    });

  } catch (err) {
    console.error('Expand error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(500).json({ error: 'Таймаут при раскрытии ссылки' });
    }
    res.status(500).json({ error: 'Не удалось раскрыть ссылку', details: err.message });
  }
}

// Извлекает @lat,lng из любого Google Maps URL
function extractCoordsFromUrl(url) {
  if (!url) return null;
  // Формат: @51.4520134,7.0214553,17z  или  @51.4520134,7.0214553,17m
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  // Формат: ll=51.452,7.021
  const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }
  return null;
}

// Ищет координаты в HTML-коде Google Maps страницы
function extractCoordsFromHtml(html) {
  if (!html) return null;

  // 1. og:url или canonical содержат @lat,lng
  const ogUrlMatch = html.match(/og:url[^>]*content="([^"]+)"/);
  if (ogUrlMatch) {
    const c = extractCoordsFromUrl(ogUrlMatch[1]);
    if (c) return c;
  }

  // 2. meta canonical
  const canonicalMatch = html.match(/rel="canonical"[^>]*href="([^"]+)"/);
  if (canonicalMatch) {
    const c = extractCoordsFromUrl(canonicalMatch[1]);
    if (c) return c;
  }

  // 3. JSON в APP_INITIALIZATION_STATE — координаты встречаются как [lat, lng]
  // Ищем пары чисел похожих на координаты Германии/Европы
  const coordPattern = /(5[0-5]\.\d{4,}),((?:[5-9]|1[0-5])\.\d{4,})/g;
  const matches = [...html.matchAll(coordPattern)];
  if (matches.length > 0) {
    // Берём первое совпадение
    return { lat: parseFloat(matches[0][1]), lng: parseFloat(matches[0][2]) };
  }

  return null;
}

function isMapsAppGooGl(url) {
  return url && (
    url.includes('maps.app.goo.gl') ||
    url.includes('goo.gl/maps')
  );
}
