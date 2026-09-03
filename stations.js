// реестр имен
const defaultCoords = {
  "Sergii": {lat: 51.530133, lng: 6.850858},
  "Anatolii": {lat: 51.522697, lng: 6.859275},
  "Aleks": {lat: 51.511287, lng: 6.878713},
  "Sergio": {lat: 51.519965, lng: 6.887640},
  "Vasyl": {lat: 51.515227, lng: 6.893755},
  "René": {lat: 51.476281, lng: 6.861856},
  "Dima": {lat: 51.551753, lng: 7.102285},
  "Andrii": {lat: 51.534558, lng: 6.861061},
  "Marvin": {lat: 51.556472, lng: 6.731424},
  "Maikel": {lat: 51.539072, lng: 7.009012}
};

// реестр станций
this.stations = {
  "Dortmund Obereving": {lat: 51.540635, lng: 7.478439},
  "Dortmund-Lütgendortmund": {lat: 51.497711, lng: 7.366530},
  "Duisburg Hochfeld": {lat: 51.409617, lng: 6.764010},
  "Düsseldorf Raht": {lat: 51.270511, lng: 6.825857},
  "Engelskirchen": {lat: 50.985726, lng: 7.408556},
  "Essen West": {lat: 51.453927, lng: 6.979462},
  "Gelsenkirchen Horst Nord": {lat: 51.541535, lng: 7.020281},
  "Gelsenkirchen Horst Nord 2": {lat: 51.539072, lng: 7.009012},
  "Gelsenkirchen-Bismarck": {lat: 51.538627, lng: 7.108037},
  "Gevelsberg-West": {lat: 51.316939, lng: 7.314008},
  "Gutersloh": {lat: 51.907774, lng: 8.388256},
  "Hagen": {lat: 51.373517, lng: 7.461144},
  "Hagen Hbf": {lat: 51.362268, lng: 7.461884},
  "Hamm": {lat: 51.672751, lng: 7.811458},
  "Holzwickede": {lat: 51.505033, lng: 7.619762},
  "Köln Kalk Nord": {lat: 50.940035, lng: 7.015802},
  "Köln Kalk Süden": {lat: 50.947590, lng: 7.012243},
  "Köln-Deutzerfeld": {lat: 50.939972, lng: 6.987889},
  "Köln-Kalk, Stumpfgleis": {lat: 50.931185, lng: 7.013403},
  "Lage": {lat: 51.991198, lng: 8.800968},
  "Münster (Westf)": {lat: 51.955868, lng: 7.636740},
  "Recklinghausen": {lat: 51.568298, lng: 7.198117},
  "Schwerte": {lat: 51.440231, lng: 7.558396},
  "Wanne-Eickel": {lat: 51.536053, lng: 7.184348},
  "Wuppertal-Langerfeld": {lat: 51.278872, lng: 7.244835},
  "Wuppertal-Steinbeck": {lat: 51.245710, lng: 7.130845},
  "Wuppertal-Vohwinkel": {lat: 51.233474, lng: 7.072435}
};

// Время в пути между участниками
this.travelTimes = {
  "Sergii-Anatolii": 5,
  "Sergii-Andrii": 5,
  "Sergii-Sergio": 10,
  "Sergii-Dima": 30,
  "Andrii-Anatolii": 5,
  "Andrii-Sergio": 10,
  "Andrii-Dima": 25,
  "Anatolii-Sergio": 10,
  "Anatolii-Dima": 25,
  "Sergio-Dima": 30,
  "Marvin-Sergii": 20,
  "Marvin-Anatolii": 20,
  "Marvin-Andrii": 20,
  "Marvin-Sergio": 25,
  "Marvin-Dima": 30,
  "Maikel-Sergii": 25,
  "Maikel-Andrii": 20,
  "Maikel-Anatolii": 20,
  "Maikel-Sergio": 25,
  "Maikel-Dima": 30,
  "Maikel-Marvin": 5,
  "René-Sergii": 15,
  "René-Andrii": 15,
  "René-Anatolii": 15,
  "René-Sergio": 15,
  "René-Dima": 30,
  "René-Marvin": 20,
  "René-Maikel": 20,
  "Vasyl-Sergii": 15,
  "Vasyl-Andrii": 10,
  "Vasyl-Anatolii": 10,
  "Vasyl-Sergio": 5,
  "Vasyl-Dima": 30,
  "Vasyl-Marvin": 20,
  "Vasyl-Maikel": 20,
  "Vasyl-René": 15,
  "Maikel-René": 25,
  "Maikel-Vasyl": 20,
  "Aleks-Sergii": 15,
  "Aleks-Anatolii": 10,
  "Aleks-Andrii": 10,
  "Aleks-Sergio": 5,
  "Aleks-Dima": 30,
  "Aleks-René": 15,
  "Aleks-Marvin": 25,
  "Aleks-Vasyl": 5,
  "Aleks-Maikel": 25
};

// Пункты встречи (Treffpunkt)
this.treffpunkt = {
  "Golf Parkplatz": {lat: 51.522611, lng: 6.893011},
  "Lirich P&R Parkplatz": {lat: 51.475975, lng: 6.812210},
  "OLGA-Park": {lat: 51.500434, lng: 6.868634},
  "P&R A42": {lat: 51.535695, lng: 7.096155},
  "P&R Herten A2": {lat: 51.572438, lng: 7.133029},
  "Rathaus Osterfeld": {lat: 51.501270, lng: 6.889513}
};

// Время в пути от пункта встречи до каждого участника
this.trefftravelTimes = {
  "OLGA-Park-Sergii": 10,
  "OLGA-Park-Andrii": 10,
  "OLGA-Park-Anatolii": 10,
  "OLGA-Park-Sergio": 10,
  "OLGA-Park-Dima": 25,
  "OLGA-Park-Marvin": 15,
  "OLGA-Park-Maikel": 20,
  "OLGA-Park-René": 10,
  "OLGA-Park-Vasyl": 10,
  "Lirich P&R Parkplatz-Sergii": 15,
  "Lirich P&R Parkplatz-Anatolii": 15,
  "Lirich P&R Parkplatz-Andrii": 15,
  "Lirich P&R Parkplatz-Sergio": 20,
  "Lirich P&R Parkplatz-Dima": 28,
  "Lirich P&R Parkplatz-René": 10,
  "Lirich P&R Parkplatz-Marvin": 15,
  "Lirich P&R Parkplatz-Vasyl": 15,
  "Lirich P&R Parkplatz-Maikel": 25,
  "Lirich P&R Parkplatz-Aleks": 15,
  "Rathaus Osterfeld-Sergii": 15,
  "Rathaus Osterfeld-Anatolii": 15,
  "Rathaus Osterfeld-Andrii": 15,
  "Rathaus Osterfeld-Sergio": 10,
  "Rathaus Osterfeld-Dima": 25,
  "Rathaus Osterfeld-René": 10,
  "Rathaus Osterfeld-Marvin": 20,
  "Rathaus Osterfeld-Vasyl": 5,
  "Rathaus Osterfeld-Maikel": 20,
  "Rathaus Osterfeld-Aleks": 10,
  "P&R Herten A2-Sergii": 25,
  "P&R Herten A2-Anatolii": 25,
  "P&R Herten A2-Andrii": 25,
  "P&R Herten A2-Sergio": 25,
  "P&R Herten A2-Dima": 10,
  "P&R Herten A2-René": 30,
  "P&R Herten A2-Marvin": 35,
  "P&R Herten A2-Vasyl": 25,
  "P&R Herten A2-Maikel": 20,
  "P&R Herten A2-Aleks": 25,
  "Golf Parkplatz-Sergii": 10,
  "Golf Parkplatz-Anatolii": 8,
  "Golf Parkplatz-Andrii": 8,
  "Golf Parkplatz-Sergio": 2,
  "Golf Parkplatz-Dima": 24,
  "Golf Parkplatz-René": 15,
  "Golf Parkplatz-Marvin": 20,
  "Golf Parkplatz-Vasyl": 3,
  "Golf Parkplatz-Maikel": 19,
  "Golf Parkplatz-Aleks": 4,
  "P&R A42-Sergii": 25,
  "P&R A42-Andrii": 25,
  "P&R A42-Anatolii": 20,
  "P&R A42-Sergio": 20,
  "P&R A42-Dima": 10,
  "P&R A42-Marvin": 25,
  "P&R A42-Maikel": 15,
  "P&R A42-René": 20,
  "P&R A42-Vasyl": 25
};

// Приоритетные списки остановок и попутчики
this.participantOrders = {
  "Sergii": ["Anatolii","Aleks","Sergio",{"treffpunkt":"Rathaus Osterfeld","persons":["René"]}],
  "Anatolii": ["Sergii","Sergio","Vasyl"],
  "Andrii": ["Sergii","Anatolii","Sergio","Dima"],
  "Sergio": ["Anatolii","Sergii","Andrii","Dima"],
  "Dima": ["Anatolii","Sergii","Andrii","Sergio"],
  "Alex": []
};

// Прощание
const defaultFarewellData = {
  "text": "Tschüss 👋",
  "list": [
    "Tschüss 👋",
    "Bis bald 👋",
    "Bis später 👋",
    "Bis morgen früh 👋"
  ]
};

// Список приветствий
const defaultGreetingsData = [
  "Moin zusammen",
  "Hallo zusammen",
  "Guten Morgen",
  "Guten Tag"
];

// Конечные точки
const defaultMachineDestinationsData = [
  { name: "an der Maschine", lat: null, lng: null },
  { name: "im Büro Bochum", lat: 51.503883, lng: 7.240038 },
  { name: "an der Sauna", lat: 51.509300, lng: 6.903112 },
  { name: "Hotel \"Am Stadtpark\"", lat: 51.178319, lng: 9.368378 },
  { name: "Opladen Plasser", lat: 51.059318, lng: 7.012283 },
  { name: "Deutsch Kurs", lat: 51.481780, lng: 7.137622 }
];

// Служебный блок редактора: когда запись добавлена (c) и изменена (u).
// Главная страница его не читает — нужен только для сортировки «по дате».
const defaultEntryMetaData = {
  "defaultCoords": {},
  "stations": {
    "Duisburg Hochfeld": {
      "c": "2026-09-03T22:51:42.865Z",
      "u": "2026-09-03T22:51:42.865Z"
    }
  },
  "treffpunkt": {
    "Rathaus Osterfeld": {
      "c": "2026-09-03T22:04:43.685Z",
      "u": "2026-09-03T22:08:01.456Z"
    }
  }
};