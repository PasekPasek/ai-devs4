export const tools = [
  {
    type: 'function',
    function: {
      name: 'check_package',
      description: 'Sprawdza status paczki. Zwraca lokalizację, status, zawartość.',
      parameters: {
        type: 'object',
        properties: {
          packageid: {
            type: 'string',
            description: 'ID paczki (np. PKG12345678)'
          }
        },
        required: ['packageid']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'redirect_package',
      description: 'Przekierowuje paczkę do nowej lokalizacji. Wymaga kodu bezpieczeństwa.',
      parameters: {
        type: 'object',
        properties: {
          packageid: {
            type: 'string',
            description: 'ID paczki'
          },
          destination: {
            type: 'string',
            description: 'Kod destynacji (np. PWR1234PL)'
          },
          code: {
            type: 'string',
            description: 'Kod bezpieczeństwa od operatora'
          }
        },
        required: ['packageid', 'destination', 'code']
      }
    }
  }
];
