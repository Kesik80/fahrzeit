// api/track-get.js
// Наблюдатель читает текущие данные сессии

const store = global._trackStore || (global._trackStore = {});

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { session } = req.query;
  if (!session) return res.status(400).json({ error: 'session required' });

  const entry = store[session];
  if (!entry)  return res.json({ found: false });

  res.json({ found: true, ...entry });
};
