export const config = {
  csvUrl: `https://hub.ag3nts.org/data/${process.env.HUB_AGENTS_TOKEN}/people.csv`,
  csvCachePath: 'tasks/S01E01-people/people.csv',
  verifyUrl: 'https://hub.ag3nts.org/verify',
  apiKey: process.env.HUB_AGENTS_TOKEN!,
  openRouterToken: process.env.OPEN_ROUTER_TOKEN!,
  batchSize: 100,
  targetGender: 'M' as const,
  targetCity: 'Grudziądz',
  minBirthYear: 1986,
  maxBirthYear: 2006,
  targetTag: 'transport' as const
};

export const llmConfig = {
  model: 'anthropic/claude-haiku-4.5',
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  maxTokens: 8000,
  temperature: 0
};
