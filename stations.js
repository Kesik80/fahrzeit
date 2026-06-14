// реестр имен
const defaultCoords = {
  'Sergii': {lat: 51.530133, lng: 6.850858},
  'Anatolii': {lat: 51.522697, lng: 6.859275},
  'Andrii': {lat: 51.534558, lng: 6.861061},
  'Sergio': {lat: 51.52, lng: 6.887619},
  'Dima': {lat: 51.551753, lng: 7.102285},
  'René': {lat: 51.476281, lng: 6.861856},
  'Marvin': {lat: 51.556472, lng: 6.731424},
  'Vasyl': {lat: 51.515227, lng: 6.893755},
  'Maikel': {lat: 51.539072, lng: 7.0090119},
  'Aleks': {lat: 51.511334, lng: 6.878848}
};

// реестр станций
this.stations = {
  'Gelsenkirchen-Bismarck': {lat: 51.538627, lng: 7.108037},
  'Hagen': {lat: 51.373517, lng: 7.461144},
  'Essen West': {lat: 51.4539273, lng: 6.9794622},
  'Gelsenkirchen Horst': {lat: 51.5415351, lng: 7.0202811},
  'Gelsenkirchen Horst 2': {lat: 51.539072, lng: 7.0090119},
  'Dortmund-Lütgendortmund': {lat: 51.497711, lng: 7.3665302},
  'Köln Kalk Nord': {lat: 50.9400354, lng: 7.0158018},
  'Gutersloh': {lat: 51.907774, lng: 8.3882563},
  'Münster (Westf)': {lat: 51.955868, lng: 7.63674},
  'Hamm': {lat: 51.6727514, lng: 7.8114577},
  'Dortmund Obereving': {lat: 51.5406353, lng: 7.478439},
  'Schwerte': {lat: 51.440231, lng: 7.558396},
  'Köln Kalk Süden': {lat: 50.94759, lng: 7.012243},
  'Wuppertal': {lat: 51.24571, lng: 7.130845},
  'Wuppertal-Vohwinkel': {lat: 51.233474, lng: 7.072435},
  'Holzwickede': {lat: 51.5050331, lng: 7.6197619},
  'Lage': {lat: 51.991198, lng: 8.800968},
  'Wanne-Eickel': {lat: 51.536053, lng: 7.184348},
  'Gevelsberg-West': {lat: 51.316939, lng: 7.314008},
  'Wuppertal-Langerfeld': {lat: 51.278872, lng: 7.244835}
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
  'Anatolii-Dima': 25,
  'Sergio-Dima': 30,
  'Marvin-Sergii': 20,
  'Marvin-Anatolii': 20,
  'Marvin-Andrii': 20,
  'Marvin-Sergio': 25,
  'Marvin-Dima': 30,
  'Maikel-Sergii': 25,
  'Maikel-Andrii': 20,
  'Maikel-Anatolii': 20,
  'Maikel-Sergio': 25,
  'Maikel-Dima': 30,
  'Maikel-Marvin': 5,
  'René-Sergii': 15,
  'René-Andrii': 15,
  'René-Anatolii': 15,
  'René-Sergio': 15,
  'René-Dima': 30,
  'René-Marvin': 20,
  'René-Maikel': 20,
  'Vasyl-Sergii': 15,
  'Vasyl-Andrii': 10,
  'Vasyl-Anatolii': 10,
  'Vasyl-Sergio': 5,
  'Vasyl-Dima': 30,
  'Vasyl-Marvin': 20,
  'Vasyl-Maikel': 20,
  'Vasyl-René': 15,
  'Maikel-René': 25,
  'Maikel-Vasyl': 20,
  'Aleks-Sergii': 15,
  'Aleks-Anatolii': 10,
  'Aleks-Andrii': 10,
  'Aleks-Sergio': 5,
  'Aleks-Dima': 30,
  'Aleks-René': 15,
  'Aleks-Marvin': 25,
  'Aleks-Vasyl': 5,
  'Aleks-Maikel': 25
};

// Пункты встречи (Treffpunkt)
this.treffpunkt = {
  'OLGA-Park': {lat: 51.5004335, lng: 6.8686337},
  'Lirich P&R Parkplatz': {lat: 51.475975, lng: 6.81221},
  'P&R Parkplatz A42': {lat: 51.535695, lng: 7.096155},
  'Rathaus Osterfeld': {lat: 51.501092, lng: 6.889317},
  'P&R Herten A2': {lat: 51.572438, lng: 7.133029}
};

// Время в пути от пункта встречи до каждого участника
this.trefftravelTimes = {
  'OLGA-Park-Sergii': 10,
  'OLGA-Park-Andrii': 10,
  'OLGA-Park-Anatolii': 10,
  'OLGA-Park-Sergio': 10,
  'OLGA-Park-Dima': 25,
  'OLGA-Park-Marvin': 15,
  'OLGA-Park-Maikel': 20,
  'OLGA-Park-René': 10,
  'OLGA-Park-Vasyl': 10,
  'Lirich P&R Parkplatz-Sergii': 15,
  'Lirich P&R Parkplatz-Anatolii': 15,
  'Lirich P&R Parkplatz-Andrii': 15,
  'Lirich P&R Parkplatz-Sergio': 20,
  'Lirich P&R Parkplatz-Dima': 28,
  'Lirich P&R Parkplatz-René': 10,
  'Lirich P&R Parkplatz-Marvin': 15,
  'Lirich P&R Parkplatz-Vasyl': 15,
  'Lirich P&R Parkplatz-Maikel': 25,
  'Lirich P&R Parkplatz-Aleks': 15,
  'P&R Parkplatz A42-Sergii': 25,
  'P&R Parkplatz A42-Andrii': 25,
  'P&R Parkplatz A42-Anatolii': 20,
  'P&R Parkplatz A42-Sergio': 20,
  'P&R Parkplatz A42-Dima': 10,
  'P&R Parkplatz A42-Marvin': 25,
  'P&R Parkplatz A42-Maikel': 15,
  'P&R Parkplatz A42-René': 20,
  'P&R Parkplatz A42-Vasyl': 25,
  'Rathaus Osterfeld-Sergii': 15,
  'Rathaus Osterfeld-Anatolii': 15,
  'Rathaus Osterfeld-Andrii': 15,
  'Rathaus Osterfeld-Sergio': 10,
  'Rathaus Osterfeld-Dima': 25,
  'Rathaus Osterfeld-René': 10,
  'Rathaus Osterfeld-Marvin': 20,
  'Rathaus Osterfeld-Vasyl': 5,
  'Rathaus Osterfeld-Maikel': 20,
  'Rathaus Osterfeld-Aleks': 10,
  'P&R Herten A2-Sergii': 25,
  'P&R Herten A2-Anatolii': 25,
  'P&R Herten A2-Andrii': 25,
  'P&R Herten A2-Sergio': 25,
  'P&R Herten A2-Dima': 10,
  'P&R Herten A2-René': 30,
  'P&R Herten A2-Marvin': 35,
  'P&R Herten A2-Vasyl': 25,
  'P&R Herten A2-Maikel': 20,
  'P&R Herten A2-Aleks': 25
};

// Приоритетные списки остановок и попутчики
this.participantOrders = {
  'Sergii': ["Anatolii","Aleks","Sergio","Vasyl",{"treffpunkt":"Rathaus Osterfeld","persons":["René"]}],
  'Anatolii': ["Sergii","Sergio","Vasyl"],
  'Andrii': ["Sergii","Anatolii","Sergio","Dima"],
  'Sergio': ["Anatolii","Sergii","Andrii","Dima"],
  'Dima': ["Anatolii","Sergii","Andrii","Sergio"],
  'Alex': []
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
  { name: 'an der Maschine', lat: null, lng: null },
  { name: 'im Büro Bochum', lat: 51.503883, lng: 7.240038 },
  { name: 'an der Sauna', lat: 51.5093, lng: 6.903112 },
  { name: 'Hotel "Am Stadtpark"', lat: 51.1783189, lng: 9.3683781 },
  { name: 'Opladen Plasser', lat: 51.0593175, lng: 7.012283399999999 },
  { name: 'Deutsch Kurs', lat: 51.48178, lng: 7.137622 }
];