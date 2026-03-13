export const config = {
  hubToken: process.env.HUB_AGENTS_TOKEN!,
  openRouterToken: process.env.OPEN_ROUTER_TOKEN!,
  verifyUrl: 'https://hub.ag3nts.org/verify',
  taskName: 'railway',
  model: 'anthropic/claude-sonnet-4-5',
  maxIterations: 30,
  max503Retries: 5,
  initialRetryDelayMs: 2000
};
