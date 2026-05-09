// Vercel Serverless Function
// Файл: /api/calculate-time.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originLat, originLng, destLat, destLng, departureTime } = req.body;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Требуются все координаты: originLat, originLng, destLat, destLng'
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API ключ не настроен на сервере'
      });
    }

    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;

    // departure_time: если передан timestamp — используем его,
    // иначе 'now' (текущее время)
    let depTime = 'now';
    if (departureTime && departureTime !== 'now') {
      // Google требует Unix timestamp в будущем
      const ts = parseInt(departureTime);
      const now = Math.floor(Date.now() / 1000);
      // Если время в прошлом — сдвигаем на следующий день
      depTime = ts > now ? ts : ts + 86400;
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(origin)}` +
      `&destinations=${encodeURIComponent(destination)}` +
      `&mode=driving` +
      `&departure_time=${depTime}` +
      `&traffic_model=best_guess` +
      `&language=de` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(500).json({
        error: 'Google API Error',
        status: data.status,
        message: data.error_message || 'Ошибка Google API'
      });
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      return res.status(400).json({
        error: 'Route not found',
        status: element?.status,
        message: 'Маршрут не найден между указанными точками'
      });
    }

    // Базовое время (без пробок)
    const durationSeconds = element.duration.value;
    const durationMinutes = Math.ceil(durationSeconds / 60);

    // Время с пробками (только если Google вернул)
    const hasTrafficData = !!element.duration_in_traffic;
    const trafficSeconds = hasTrafficData
      ? element.duration_in_traffic.value
      : durationSeconds;
    const trafficMinutes = Math.ceil(trafficSeconds / 60);

    // Пробки есть если время с трафиком больше базового на 2+ мин
    const delta = trafficMinutes - durationMinutes;
    const hasTraffic = hasTrafficData && delta >= 2;
    const trafficDeltaMin = Math.max(0, delta); // не показываем отрицательные

    const distanceMeters = element.distance.value;
    const distanceKm = (distanceMeters / 1000).toFixed(1);

    return res.status(200).json({
      success: true,
      duration: {
        seconds: trafficSeconds,          // возвращаем время С пробками
        minutes: trafficMinutes,          // используем для расписания
        text: hasTrafficData
          ? element.duration_in_traffic.text
          : element.duration.text
      },
      durationWithoutTraffic: {
        seconds: durationSeconds,
        minutes: durationMinutes,
        text: element.duration.text
      },
      distance: {
        meters: distanceMeters,
        km: parseFloat(distanceKm),
        text: element.distance.text
      },
      hasTraffic,
      trafficDeltaMin,                    // на сколько минут дольше из-за пробок
      departureTimeUsed: depTime
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
