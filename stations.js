// реестр имен
const defaultCoords = {
  'Sergii': {lat:51.530133, lng:6.850858},
  'Anatolii': {lat:51.522694, lng:6.858944},
  'Andrii': {lat:51.534558, lng:6.861061},
  'Sergio': {lat:51.52, lng:6.887619},
  'Dima': {lat:51.551753, lng:7.102285},
  'René': {lat:51.476281, lng:6.861856},
  'OLGA-Park': {lat:51.5004335, lng:6.8686337},
  'Marvin': {lat:51.556472, lng:6.731424},
  'Vasyl': {lat:51.515355, lng:6.893655}
};

// реестр станций
this.stations = {
  'Gelsenkirchen-Bismarck': {lat:51.538627, lng:7.108037},
  'Hagen': {lat:51.373517, lng:7.461144},
  'Essen West': {lat:51.4539273, lng:6.9794622}
};

// Время в пути между участниками
this.travelTimes = {
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
  'Maikel-Sergii': 20,
  'Maikel-Andrii': 20,
  'Maikel-Anatolii': 15,
  'Maikel-Sergio': 20,
  'Maikel-Dima': 30,
  'Maikel-Marvin': 5,
  'René-Sergii': 15,
  'René-Andrii': 15,
  'René-Anatolii': 15,
  'René-Sergio': 15,
  'René-Dima': 25,
  'René-Marvin': 25,
  'René-Maikel': 25,
  'Vasyl-Sergii': 10,
  'Vasyl-Andrii': 10,
  'Vasyl-Anatolii': 10,
  'Vasyl-Sergio': 5,
  'Vasyl-Dima': 20,
  'Vasyl-Marvin': 25,
  'Vasyl-Maikel': 25,
  'Vasyl-René': 25,
  'OLGA-Park-Sergii': 10,
  'OLGA-Park-Andrii': 10,
  'OLGA-Park-Anatolii': 10,
  'OLGA-Park-Sergio': 10,
  'OLGA-Park-Dima': 20,
  'OLGA-Park-Marvin': 20,
  'OLGA-Park-Maikel': 20,
  'OLGA-Park-René': 5,
  'OLGA-Park-Vasyl': 10
};

// Приоритетные списки остановок
this.participantOrders = {
  'Sergii': ['Anatolii', 'Andrii', 'Sergio', 'Dima'],
  'Anatolii': ['Sergii', 'Andrii', 'Sergio', 'Dima', 'Marvin'],
  'Andrii': ['Sergii', 'Anatolii', 'Sergio', 'Dima'],
  'Sergio': ['Anatolii', 'Sergii', 'Andrii', 'Dima'],
  'Dima': ['Anatolii', 'Sergii', 'Andrii', 'Sergio']
};