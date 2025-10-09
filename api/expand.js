// /api/expand.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Параметр "url" обязателен' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    // Проверка: это действительно URL?
    try {
      new URL(decodedUrl);
    } catch {
      return res.status(400).json({ error: 'Некорректный URL' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 сек таймаут

    const response = await fetch(decodedUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Fahrzeit-Rechner/1.0 (https://fahrzeit.vercel.app)'
      }
    });

    clearTimeout(timeout);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      original: url,
      expanded: response.url,
      status: response.status
    });
  } catch (err) {
    console.error('Expand error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(500).json({ error: 'Таймаут при раскрытии ссылки' });
    }
    res.status(500).json({ error: 'Не удалось раскрыть ссылку', details: err.message });
  }
}