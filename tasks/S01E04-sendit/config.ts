export const config = {
  hubToken: process.env.HUB_AGENTS_TOKEN!,
  docBaseUrl: 'https://hub.ag3nts.org/dane/doc',
  verifyUrl: 'https://hub.ag3nts.org/verify',
  openRouterToken: process.env.OPEN_ROUTER_TOKEN!,

  // Model selection
  model: 'openai/gpt-5-mini',
  visionModel: 'openai/gpt-4o-mini',

  // Agent limits
  maxIterations: 20,
  apiCallDelayMs: 100
};
