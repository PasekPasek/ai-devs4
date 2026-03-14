# AI_DEVS 4 - Rozwiązania zadań

Repozytorium z rozwiązaniami zadań z kursu AI_DEVS 4.

## Struktura projektu

```
ai_devs4/
├── .env                          # Współdzielone zmienne środowiskowe
├── package.json                  # Wszystkie zależności
├── tsconfig.json                 # Wspólna konfiguracja TypeScript
└── tasks/
    ├── S01E01-people/            # Wykrywanie anomalii w danych osobowych
    ├── S01E02-findhim/           # Agent identyfikujący podejrzanego na podstawie opisów
    ├── S01E03-proxy/             # Proxy server z inteligentnym przekierowaniem paczek
    ├── S01E04-sendit/            # Agent wypełniający deklaracje SPK
    └── S01E05-railway/           # Agent odblokowujący trasę kolejową X-01
```

## Uruchamianie zadań

```bash
# Pojedyncze uruchomienie
npm run S01E01-people
npm run S01E02-findhim
npm run S01E03-proxy
npm run S01E04-sendit
npm run S01E05-railway

# Tryb watch (auto-reload przy zmianach)
npm run S01E01-people:watch
npm run S01E03-proxy:watch

# Bezpośrednie uruchomienie (dla zadań bez skryptu npm)
npm run task tasks/S01E02-nazwa/index.ts
```

## Dodawanie nowego zadania

### 1. Utwórz katalog zadania
```bash
mkdir tasks/S01E02-robots
```

### 2. Stwórz główny plik
```bash
cat > tasks/S01E02-robots/index.ts << 'EOF'
import 'dotenv/config';

async function main() {
  console.log('Starting S01E02-robots task');
  // Task logic here
}

main().catch(console.error);
EOF
```

### 3. Dodaj zależności (jeśli potrzebne)
```bash
# Przykład - wszystkie paczki instalowane w root
npm install cheerio axios
```

### 4. Dodaj skrypt npm do package.json
```json
{
  "scripts": {
    "S01E02-robots": "tsx tasks/S01E02-robots/index.ts",
    "S01E02-robots:watch": "tsx watch tasks/S01E02-robots/index.ts"
  }
}
```

### 5. Uruchom zadanie
```bash
npm run S01E02-robots
```

## Zmienne środowiskowe

Plik `.env` w root repozytorium zawiera współdzielone zmienne:

```env
HUB_AGENTS_TOKEN=your_token_here
OPEN_ROUTER_TOKEN=your_openrouter_token
# ... inne zmienne
```

## Konwencje nazewnicze

- **Format katalogu**: `S{sezon:02d}E{epizod:02d}-{nazwa}`
- **Przykłady**:
  - `S01E01-people` - sezon 1, epizod 1, zadanie "people"
  - `S02E05-documents` - sezon 2, epizod 5, zadanie "documents"

## TypeScript

```bash
# Sprawdź błędy kompilacji
npx tsc --noEmit

# Uruchom z tsx (już skonfigurowane w package.json)
npm run task your-file.ts
```

## Ignorowane pliki

Automatycznie ignorowane przez git:
- `.env` - zmienne środowiskowe
- `node_modules/` - zależności
- `*.csv` - pliki danych
- `*.cache` - pliki cache
- `dist/` - skompilowane pliki

## Przykładowa struktura zadania

```
tasks/S01E01-people/
├── index.ts           # Główny plik
├── config.ts          # Konfiguracja (URLs, parametry)
├── types.ts           # Typy TypeScript / schematy Zod
├── utils.ts           # Funkcje pomocnicze
└── people.csv         # Dane (ignorowane przez git)
```

## Struktura agenta (S01E04+)

Zadania oparte na agencie LLM używają wspólnego wzorca:

```
tasks/S01EXX-nazwa/
├── index.ts           # Punkt wejścia, system prompt, main()
├── config.ts          # Stałe: URL, model, limity iteracji
├── agent.ts           # Pętla agenta (OpenRouter + tool calling)
├── tools.ts           # Definicje narzędzi (format OpenAI function calling)
└── tool-handlers.ts   # Implementacja narzędzi, obsługa błędów HTTP
```

Model: `anthropic/claude-sonnet-4-5` via OpenRouter

## Wsparcie

Każde zadanie może mieć własną strukturę - powyższy przykład to tylko sugestia.
