import dotenv from 'dotenv';

dotenv.config();

export const config = {
  HUB_AGENTS_TOKEN: process.env.HUB_AGENTS_TOKEN!,
  OPEN_ROUTER_TOKEN: process.env.OPEN_ROUTER_TOKEN!,
  PACKAGE_API_URL: 'https://hub.ag3nts.org/api/packages',
  VERIFY_URL: 'https://hub.ag3nts.org/verify',
  MODEL_NAME: 'openai/gpt-5-mini',
  MAX_ITERATIONS: 10,
  SERVER_PORT: 3000,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000 // 30 minutes
};

// Validate required environment variables
if (!config.HUB_AGENTS_TOKEN) {
  throw new Error('HUB_AGENTS_TOKEN environment variable is required');
}

if (!config.OPEN_ROUTER_TOKEN) {
  throw new Error('OPEN_ROUTER_TOKEN environment variable is required');
}
