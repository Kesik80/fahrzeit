export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const response = await fetch(
      `https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'FahrzeitRechner/1.0' } }
    );
    const short = await response.text();
    console.log('[shorten] status:', response.status, 'body:', short);
    if (!response.ok) throw new Error(`v.gd error: ${response.status} — ${short}`);
    if (!short.startsWith('https://')) throw new Error(`Unexpected response: ${short}`);
    res.status(200).json({ short });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
