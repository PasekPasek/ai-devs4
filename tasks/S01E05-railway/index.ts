import 'dotenv/config';
import { runAgent } from './agent.js';
import { tools } from './tools.js';
import { config } from './config.js';

const systemPrompt = `Twoim zadaniem jest odblokowanie trasy kolejowej X-01 poprzez interakcję z API.

Zacznij od wysłania akcji help: call_api({action: "help"})
Dokładnie przeczytaj odpowiedź - API jest samo-dokumentujące.
Postępuj zgodnie z instrukcjami z help - używaj dokładnych nazw akcji i parametrów.
Gdy znajdziesz flagę w formacie {FLG:...}, zadanie jest ukończone.

Uwagi:
- API może zwracać błędy 503 - są obsługiwane automatycznie przez narzędzie
- Przestrzegaj limitów zapytań (rate limits) - narzędzie automatycznie czeka gdy są wymagane
- Nie rezygnuj po pierwszym błędzie - czytaj komunikaty i dostosowuj działanie`;

async function main() {
  console.log('=== S01E05 Railway Agent ===');
  console.log(`Hub Token: ${config.hubToken ? 'SET' : 'MISSING'}`);
  console.log(`OpenRouter Token: ${config.openRouterToken ? 'SET' : 'MISSING'}`);
  console.log('');

  if (!config.hubToken || !config.openRouterToken) {
    console.error('ERROR: Missing required environment variables (HUB_AGENTS_TOKEN, OPEN_ROUTER_TOKEN)');
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
