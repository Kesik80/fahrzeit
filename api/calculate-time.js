// Vercel Serverless Function
// Файл: /api/calculate-time.js

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Проверяем метод
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originLat, originLng, destLat, destLng } = req.body;

    // Валидация
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ 
        error: 'Missing coordinates',
        message: 'Требуются все координаты: originLat, originLng, destLat, destLng' 
      });
    }

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API ключ не настроен на сервере' 
      });
    }

    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;

    // Запрос к Google Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&language=de&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Проверяем ответ от Google API
    if (data.status !== 'OK') {
      console.error('Google API Error:', data);
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

    // Извлекаем данные
    const durationSeconds = element.duration.value;
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const distanceMeters = element.distance.value;
    const distanceKm = (distanceMeters / 1000).toFixed(1);

    // Возвращаем результат
    return res.status(200).json({
      success: true,
      duration: {
        seconds: durationSeconds,
        minutes: durationMinutes,
        text: element.duration.text
      },
      distance: {
        meters: distanceMeters,
        km: parseFloat(distanceKm),
        text: element.distance.text
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
