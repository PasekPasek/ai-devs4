/**
 * Tool definitions for the FindHim agent
 * Following OpenAI Function Calling format
 */
export const tools = [
  {
    type: 'function',
    function: {
      name: 'load_suspects',
      description: 'Wczytuje listę podejrzanych z zadania S01E01 (mężczyźni z Grudziądza, 1986-2006, transport). Zwraca 5 osób z polami: name, surname, gender, born (rok jako liczba), city, tags.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_power_plants',
      description: 'Pobiera listę elektrowni atomowych z ich współrzędnymi GPS i kodami identyfikacyjnymi. Zwraca array obiektów z polami: id (kod elektrowni), name, lat, lon.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_person_locations',
      description: 'Pobiera listę lokalizacji (współrzędne GPS) gdzie widziano daną osobę. Zwraca array obiektów {lat, lon}.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Imię osoby' },
          surname: { type: 'string', description: 'Nazwisko osoby' }
        },
        required: ['name', 'surname']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_distance',
      description: 'Oblicza odległość w kilometrach między dwoma punktami GPS używając wzoru Haversine. Zwraca liczbę (km).',
      parameters: {
        type: 'object',
        properties: {
          lat1: { type: 'number', description: 'Szerokość geograficzna punktu 1' },
          lon1: { type: 'number', description: 'Długość geograficzna punktu 1' },
          lat2: { type: 'number', description: 'Szerokość geograficzna punktu 2' },
          lon2: { type: 'number', description: 'Długość geograficzna punktu 2' }
        },
        required: ['lat1', 'lon1', 'lat2', 'lon2']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_access_level',
      description: 'Pobiera poziom dostępu (1-5) dla danej osoby z systemu. Zwraca liczbę.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Imię osoby' },
          surname: { type: 'string', description: 'Nazwisko osoby' },
          birthYear: { type: 'integer', description: 'Rok urodzenia jako liczba (np. 1987)' }
        },
        required: ['name', 'surname', 'birthYear']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'submit_answer',
      description: 'FINALNA funkcja - wysyła odpowiedź do weryfikacji. Wywołaj TYLKO gdy masz pewność wszystkich danych. Zwraca obiekt z flag lub błąd.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Imię znalezionej osoby' },
          surname: { type: 'string', description: 'Nazwisko znalezionej osoby' },
          accessLevel: { type: 'integer', description: 'Poziom dostępu (1-5)' },
          powerPlant: { type: 'string', description: 'Kod elektrowni (np. PWR1234PL)' }
        },
        required: ['name', 'surname', 'accessLevel', 'powerPlant']
      }
    }
  }
];
