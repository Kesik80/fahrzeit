// api/defaults.js  ← лежит в корне проекта, рядом с index.html
export default async function handler(req, res) {
  // разрешаем CORS, если вдруг фронт на другом домене
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // один JSON = всё статическое
  res.status(200).json({
    names: {
      'Sergii': { lat: 51.530133, lng: 6.850858 },
      'Anatolii': { lat: 51.522694, lng: 6.858944 },
      'Andrii': { lat: 51.534558, lng: 6.861061 },
      'Sergio': { lat: 51.520000, lng: 6.887619 },
      'Dima': { lat: 51.551753, lng: 7.102285 },
      'René - Olga Park': { lat: 51.5004952, lng: 6.8685049 },
      'Marvin': { lat: 51.556472, lng: 6.731424 }
    },
    participantOrders: {
      'Sergii': ['Anatolii', 'Andrii', 'Sergio', 'Dima'],
      'Anatolii': ['Sergii', 'Andrii', 'Sergio', 'Dima', 'Marvin'],
      'Andrii': ['Sergii', 'Anatolii', 'Sergio', 'Dima'],
      'Sergio': ['Anatolii', 'Sergii', 'Andrii', 'Dima'],
      'Dima': ['Anatolii', 'Sergii', 'Andrii', 'Sergio']
    },
    travelTimes: {
      'Sergii-Anatolii': 5,
      'Sergii-Andrii': 5,
      'Sergii-Sergio': 10,
      'Sergii-Dima': 30,
      'Andrii-Anatolii': 5,
      'Andrii-Sergio': 10,
      'Andrii-Dima': 25,
      'Anatolii-Sergio': 10,
      'Anatolii-Dima': 30,
      'Sergio-Dima': 25,
      'Marvin-Sergii': 20,
      'Marvin-Anatolii': 17,
      'Marvin-Andrii': 20,
      'Marvin-Sergio': 25,
      'Marvin-Dima': 30,
      'René - Olga Park-Sergii': 10,
      'René - Olga Park-Andrii': 10,
      'René - Olga Park-Anatolii': 8,
      'René - Olga Park-Sergio': 8,
      'René - Olga Park-Dima': 25,
      'René - Olga Park-Marvin': 20,
      'René - Olga Park-Maikel': 20
    }
  });
}