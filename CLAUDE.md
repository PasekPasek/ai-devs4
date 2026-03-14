# AI_DEVS4 — Instrukcje dla agenta

## Stack

TypeScript + tsx (ESM), bez kompilacji. Jedno repozytorium, wiele zadań w `tasks/`.

## Pattern agentowy

Zadania oparte na LLM używają pętli agenta z tool callingiem przez OpenRouter:

- Agent wywołuje LLM → LLM zwraca tool calls → agent wykonuje narzędzia → wyniki wracają do LLM → repeat
- Stop gdy: LLM nie zwróci tool calls, lub w wyniku pojawi się flaga `{FLG:...}`
- Pętla ma limit iteracji — zabezpieczenie przed nieskończoną pętlą
- System prompt po polsku, task-aware — agent powinien wiedzieć dokładnie co robi

## Pattern narzędzi

- Jedno narzędzie = jedna odpowiedzialność biznesowa (np. `call_api`, `fetch_document`)
- Narzędzie **nigdy nie zwraca błędów infrastrukturalnych** (503, 429, timeout) — obsługuje je wewnętrznie
- Narzędzie zwraca JSON string z `{status, body, headers}` — agent czyta to jako wynik
- Błędy biznesowe (np. zły parametr, brak uprawnień) zwracaj do agenta — niech sam zdecyduje co dalej

## Obsługa HTTP

```
503 → exponential backoff (2s, 4s, 8s...), max kilka razy, potem błąd
429 → czekaj retry-after (header w sekundach → ms), potem retry bez limitu
      x-ratelimit-reset to Unix timestamp w sekundach, nie ISO string
sieć → rzuć Error natychmiast
```

429 i 503 rozdzielaj na **osobne liczniki** — 503 ma limit, 429 nie.

## Flagi

Format: `{FLG:NAZWA}` — szukaj regexem `\{FLG:[^}]+\}` w każdej odpowiedzi API.

Flagi mogą być **ukryte** — pojawiają się przy niestandardowym użyciu API (nieoczekiwana sekwencja akcji, ignorowanie wskazówek, inne wartości parametrów). Zawsze warto zbadać co się stanie gdy nie stosuje się do instrukcji.

## TypeScript

```ts
// response.json() zwraca unknown — zawsze rzutuj
const data = await response.json() as MyType;  // lub as any
```

## OpenRouter

Model: `anthropic/claude-sonnet-4-5`
Wymagane nagłówki: `Authorization: Bearer ...`, `HTTP-Referer`, `X-Title`
Tool choice: `"auto"` — agent sam decyduje kiedy używać narzędzi

## Env vars

`HUB_AGENTS_TOKEN`, `OPEN_ROUTER_TOKEN` — ładowane przez `import 'dotenv/config'`
Waliduj na starcie, zakończ z `process.exit(1)` jeśli brakuje.
