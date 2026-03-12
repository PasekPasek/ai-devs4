/**
 * Tool definitions for the SentIt agent (SPK declaration filler)
 * Following OpenAI Function Calling format
 */
export const tools = [
  {
    type: 'function',
    function: {
      name: 'fetch_document',
      description: 'Pobiera plik tekstowy (markdown) z serwera dokumentacji SPK. Zwraca surowy tekst dokumentu.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Pełny URL dokumentu do pobrania (np. https://hub.ag3nts.org/dane/doc/index.md)' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_image',
      description: 'Pobiera obraz z podanego URL i analizuje go modelem vision. Zwraca odpowiedź na pytanie dotyczące zawartości obrazu.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL obrazu do analizy' },
          question: { type: 'string', description: 'Pytanie dotyczące zawartości obrazu' }
        },
        required: ['url', 'question']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'submit_declaration',
      description: 'FINALNA funkcja - wysyła wypełnioną deklarację SPK do weryfikacji. Wywołaj TYLKO gdy masz kompletną i poprawną deklarację. Zwraca flagę lub komunikat błędu.',
      parameters: {
        type: 'object',
        properties: {
          declaration: { type: 'string', description: 'Pełny tekst wypełnionej deklaracji SPK zgodny ze wzorem z załącznika E' }
        },
        required: ['declaration']
      }
    }
  }
];
