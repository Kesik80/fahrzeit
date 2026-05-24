export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query || (req.method === 'POST' && req.body) || {};
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // DDMMYYHHmmss по времени Германии
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const dd  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const yy  = String(now.getFullYear()).slice(-2);
  const HH  = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const customCode = `${dd}${mm}${yy}${HH}${min}${ss}`; // e.g. 240526232030

  try {
    const response = await fetch('https://fhr.pp.ua/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customCode })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error');
    if (!data.short) throw new Error('No short URL returned');

    res.status(200).json({ short: data.short });
  } catch (e) {
    console.error('❌ URL shortening failed:', e.message);
    res.status(500).json({ error: e.message });
  }
}
