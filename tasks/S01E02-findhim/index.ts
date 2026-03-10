import 'dotenv/config';
import { runAgent } from './agent.js';
import { tools } from './tools.js';
import { config } from './config.js';

const SYSTEM_PROMPT = `Jesteś detektywem AI. Twoim zadaniem jest znaleźć osobę z listy podejrzanych, która była NAJBLIŻEJ jednej z elektrowni atomowych.

DOSTĘPNE NARZĘDZIA:
- load_suspects() - pobierz listę podejrzanych (5 osób z zadania S01E01)
- fetch_power_plants() - pobierz lokalizacje elektrowni z kodami
- get_person_locations(name, surname) - pobierz współrzędne gdzie widziano osobę
- calculate_distance(lat1, lon1, lat2, lon2) - oblicz odległość w km (wzór Haversine)
- get_access_level(name, surname, birthYear) - poziom dostępu osoby
- submit_answer(name, surname, accessLevel, powerPlant) - wyślij finalną odpowiedź

STRATEGIA (wykonuj krok po kroku):
1. Załaduj listę podejrzanych (5 osób) i elektrowni
2. Dla KAŻDEGO podejrzanego:
   a) Pobierz jego lokalizacje (współrzędne latitude/longitude)
   b) Dla KAŻDEJ lokalizacji tej osoby:
      - Oblicz odległość do KAŻDEJ elektrowni
      - Zapamiętaj najmniejszą odległość
3. Po sprawdzeniu wszystkich osób: wybierz osobę z GLOBALNIE NAJMNIEJSZĄ odległością
4. Dla tej osoby: pobierz poziom dostępu (użyj pola "born" jako birthYear)
5. Zidentyfikuj kod elektrowni, do której była najbliżej
6. Wyślij odpowiedź

KLUCZOWE ZASADY:
- API location zwraca współrzędne jako {latitude, longitude} (NIE lat/lon!)
- Do calculate_distance przekaż: lat1=latitude1, lon1=longitude1, lat2=latitude2, lon2=longitude2
- Lista podejrzanych ma pole "born" które JUŻ JEST ROKIEM jako liczba (np. 1987)
- Szukasz osoby z ABSOLUTNIE NAJMNIEJSZĄ odległością spośród WSZYSTKICH osób
- submit_answer wywołaj TYLKO RAZ, gdy masz pewność
- Kod elektrowni ma format np. "PWR7264PL"

PRZYKŁAD MYŚLENIA:
"Sprawdzę wszystkich 5 podejrzanych. Dla każdego:
- Pobiorę wszystkie jego lokalizacje
- Dla każdej lokalizacji obliczę odległość do wszystkich elektrowni
- Znajdę najmniejszą odległość dla tej osoby
Potem porównam wyniki i wybiorę osobę z NAJMNIEJSZĄ wartością."`;

async function main() {
  try {
    console.log('=== AI_DEVS 4 - S01E02 FindHim Agent ===\n');

    // Validate environment
    if (!config.hubToken) {
      throw new Error('Missing HUB_AGENTS_TOKEN in environment');
    }
    if (!config.openRouterToken) {
      throw new Error('Missing OPEN_ROUTER_TOKEN in environment');
    }

    console.log('✓ Environment validated');
    console.log(`✓ Using model: ${config.model}`);
    console.log(`✓ Max iterations: ${config.maxIterations}\n`);

    // Run the agent
    const result = await runAgent(SYSTEM_PROMPT, tools, config.maxIterations);

    // Display final result
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));

    if (result.result?.flag) {
      console.log(`\n🎉 SUCCESS! Flag: ${result.result.flag}`);
      console.log('\nSubmit this flag at: https://hub.ag3nts.org/');
    } else if (result.result?.success === false) {
      console.log('\n❌ Task failed. Check the error message above.');
    }

    console.log(`\nCompleted in ${result.iterations} iterations.`);

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
