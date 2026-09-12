// Vercel Serverless Function
// Файл: /api/place-id.js
//
// Превращает координаты в place_id — настоящий идентификатор места у Google.
// Зачем: голая пара lat,lng в ссылке на маршрут для Google лишь запрос, который
// он геокодирует заново при каждом пересчёте — отсюда увод к соседнему адресу.
// place_id этой неоднозначности не оставляет.
//
// Вход:  POST { points: [{lat, lng}, ...] }   (до 25 точек за раз)
// Выход: { results: [{placeId, address, precision} | null, ...] }  — по индексу входа

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error', message: 'API ключ не настроен' });
  }

  const points = (req.body && req.body.points) || [];
  if (!Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ error: 'Missing points' });
  }
  if (points.length > 25) {
    return res.status(400).json({ error: 'Too many points', message: 'Максимум 25 точек за запрос' });
  }

  // Чем выше в списке — тем точнее привязка к конкретному зданию.
  // ROOFTOP + street_address это ровно «этот дом», а не «где-то на этой улице».
  const TYPE_RANK = ['premise', 'street_address', 'subpremise', 'establishment',
                     'transit_station', 'point_of_interest', 'route'];

  const pickBest = (results) => {
    if (!results || !results.length) return null;
    const score = (r) => {
      let s = 0;
      const t = r.types || [];
      const idx = TYPE_RANK.findIndex(k => t.includes(k));
      s += idx === -1 ? 0 : (TYPE_RANK.length - idx) * 10;
      const lt = r.geometry && r.geometry.location_type;
      if (lt === 'ROOFTOP') s += 25;
      else if (lt === 'RANGE_INTERPOLATED') s += 12;
      else if (lt === 'GEOMETRIC_CENTER') s += 6;
      return s;
    };
    return results.slice().sort((a, b) => score(b) - score(a))[0];
  };

  const bad = v => v === undefined || v === null || v === '' || !isFinite(Number(v));

  try {
    const results = await Promise.all(points.map(async (p) => {
      if (!p || bad(p.lat) || bad(p.lng)) return null;
      const latlng = `${Number(p.lat)},${Number(p.lng)}`;
      const url = 'https://maps.googleapis.com/maps/api/geocode/json'
        + `?latlng=${encodeURIComponent(latlng)}`
        + '&language=de&result_type=premise|street_address|subpremise|establishment|transit_station|point_of_interest'
        + `&key=${apiKey}`;
      try {
        const r = await fetch(url);
        const d = await r.json();
        if (d.status !== 'OK') {
          // ZERO_RESULTS для точки в поле — нормальная ситуация, не ошибка
          return { placeId: null, address: null, precision: d.status };
        }
        const best = pickBest(d.results);
        if (!best) return { placeId: null, address: null, precision: 'NO_MATCH' };
        return {
          placeId: best.place_id || null,
          address: best.formatted_address || null,
          precision: (best.geometry && best.geometry.location_type) || null
        };
      } catch (e) {
        return { placeId: null, address: null, precision: 'FETCH_ERROR' };
      }
    }));

    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error', message: e.message });
  }
}
