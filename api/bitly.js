// bitly

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Получаем URL из query или body
  const { url } = req.query || (req.method === 'POST' && req.body) || {};
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // 🔐 Токен из переменных окружения
  const BITLY_TOKEN = process.env.BITLY_ACCESS_TOKEN;
  if (!BITLY_TOKEN) {
    console.error('❌ BITLY_ACCESS_TOKEN not configured');
    return res.status(500).json({ error: 'Bitly token not configured' });
  }

  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITLY_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FahrzeitRechner/1.0'
      },
      body: JSON.stringify({
        long_url: url,
        title: 'Fahrzeit Route'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Bitly API error ${response.status}: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.link) throw new Error('No short URL returned from Bitly');

    // Возвращаем в том же формате — фронтенд менять не нужно ✅
    res.status(200).json({ short: data.link });

  } catch (e) {
    console.error('❌ URL shortening failed:', e.message);
    res.status(500).json({ error: e.message });
  }
}