import 'dotenv/config';
import { runAgent } from './agent.js';
import { tools } from './tools.js';
import { config } from './config.js';

const systemPrompt = `Jesteś agentem wypełniającym deklaracje w Systemie Przesyłek Konduktorskich (SPK).

## Twoje zadanie
Wypełnij i wyślij deklarację transportową dla następującej przesyłki:
- Nadawca (ID): 450202122
- Punkt nadawczy: Gdańsk
- Punkt docelowy: Żarnowiec
- Opis zawartości: kasety z paliwem do reaktora
- Masa: 2800 kg
- Uwagi specjalne: brak

Dokumentacja systemu SPK dostępna jest pod adresem: ${config.docBaseUrl}/index.md

Zasady działania:
- Wszystkie potrzebne informacje zdobywaj samodzielnie przez narzędzia - nie pytaj użytkownika
- Dokumentacja zawiera pliki tekstowe ORAZ pliki graficzne - musisz przeanalizować oba typy
- Jeśli hub odrzuci deklarację z błędem, popraw ją i wyślij ponownie
- Wyślij deklarację przez submit_declaration dopiero gdy masz wszystkie wymagane dane
Dzisiejsza data: 2026-03-12`;

async function main() {
  console.log('=== S01E04 SentIt Agent ===');
  console.log(`Hub Token: ${config.hubToken ? 'SET' : 'MISSING'}`);
  console.log(`OpenRouter Token: ${config.openRouterToken ? 'SET' : 'MISSING'}`);
  console.log('');

  if (!config.hubToken || !config.openRouterToken) {
    console.error('ERROR: Missing required environment variables');
    process.exit(1);
  }

  try {
    const result = await runAgent(systemPrompt, tools, config.maxIterations);
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Agent failed:', error);
    process.exit(1);
  }
}

main();
