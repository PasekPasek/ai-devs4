# AI_DEVS 4 - Rozwiązania zadań

Repozytorium z rozwiązaniami zadań z kursu AI_DEVS 4.

## Struktura projektu

```
ai_devs4/
├── .env                          # Współdzielone zmienne środowiskowe
├── package.json                  # Wszystkie zależności
├── tsconfig.json                 # Wspólna konfiguracja TypeScript
└── tasks/
    ├── S01E01-people/            # Format: S{sezon:02d}E{epizod:02d}-{nazwa}
    ├── S01E02-.../
    └── ...
```

## Uruchamianie zadań

```bash
# Pojedyncze uruchomienie
npm run S01E01-people

# Tryb watch (auto-reload przy zmianach)
npm run S01E01-people:watch

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

## Wsparcie

Każde zadanie może mieć własną strukturę - powyższy przykład to tylko sugestia.
