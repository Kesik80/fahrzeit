// api/track-set.js
// Водитель отправляет свои координаты
// Храним в памяти процесса (сбрасывается при cold start, но для трекинга достаточно)

const store = global._trackStore || (global._trackStore = {});

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'POST only' });

  const { session, lat, lng, speed, heading, accuracy, active, mapsUrl, startedAt } = req.body || {};
  if (!session) return res.status(400).json({ error: 'session required' });

  if (!store[session]) store[session] = { path: [] };

  const entry = store[session];
  entry.ts        = Date.now();
  entry.active    = active !== false;
  entry.speed     = speed   ?? null;
  entry.heading   = heading ?? null;
  entry.accuracy  = accuracy ?? null;

  if (mapsUrl)   entry.mapsUrl   = mapsUrl;
  if (startedAt) entry.startedAt = startedAt;

  if (lat != null && lng != null) {
    entry.lat = lat;
    entry.lng = lng;
    // Храним последние 500 точек пути
    entry.path.push({ lat, lng, ts: Date.now() });
    if (entry.path.length > 500) entry.path.shift();
  }

  res.json({ ok: true });
};
