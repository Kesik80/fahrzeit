// bitly

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query?.url || req.body?.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  const BITLY_TOKEN = process.env.BITLY_ACCESS_TOKEN;
  if (!BITLY_TOKEN) {
    console.error('❌ BITLY_ACCESS_TOKEN not configured');
    return res.status(500).json({ error: 'Bitly token not configured' });
  }

  try {
    // Сокращаем через Bitly
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITLY_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FahrzeitRechner/1.0'
      },
      body: JSON.stringify({ long_url: url, title: 'Fahrzeit Route' })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Bitly API error ${response.status}: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.link) throw new Error('No short URL returned from Bitly');

    // Сохраняем в fhr-shortener:
    // url = оригинальный маршрут (Original)
    // customCode = код из bit.ly ссылки (Short будет https://fhr.pp.ua/4uwXGCJ)
    // Когда fhr.pp.ua заработает — short станет рабочей ссылкой
    try {
      const bitlyCode = data.link.split('/').pop(); // извлекаем код: 4uwXGCJ
      await fetch('https://fhr-shortener.vercel.app/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customCode: bitlyCode })
      });
    } catch (e) {
      console.warn('fhr-shortener save failed (non-critical):', e.message);
    }

    res.status(200).json({ short: data.link });

  } catch (e) {
    console.error('❌ URL shortening failed:', e.message);
    res.status(500).json({ error: e.message });
  }
}
