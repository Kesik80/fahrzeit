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
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'FahrzeitRechner/1.0' } }
    );
    if (!response.ok) throw new Error(`TinyURL error: ${response.status}`);
    const short = await response.text();
    if (!short.startsWith('https://')) throw new Error('Invalid response');
    res.status(200).json({ short });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
