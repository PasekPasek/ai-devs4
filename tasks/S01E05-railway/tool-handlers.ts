import { config } from './config.js';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

function computeWaitMs(headers: Record<string, string>): number {
  const retryAfter = headers['retry-after'];
  const resetTime = headers['x-ratelimit-reset'];

  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  if (resetTime) {
    const asUnix = parseFloat(resetTime);
    if (!isNaN(asUnix) && asUnix > 1e9) {
      const waitMs = asUnix * 1000 - Date.now() + 500;
      if (waitMs > 0) return waitMs;
    } else {
      const resetMs = new Date(resetTime).getTime();
      const waitMs = resetMs - Date.now() + 500;
      if (!isNaN(resetMs) && waitMs > 0) return waitMs;
    }
  }

  return 5000;
}

function parseRateLimitHeaders(headers: Headers): Record<string, string> {
  const relevant: Record<string, string> = {};
  const keys = [
    'x-ratelimit-remaining',
    'x-ratelimit-limit',
    'x-ratelimit-reset',
    'retry-after',
    'ratelimit-reset-requests',
    'ratelimit-reset-tokens'
  ];
  for (const key of keys) {
    const val = headers.get(key);
    if (val !== null) relevant[key] = val;
  }
  return relevant;
}


async function fetchWithRetry(answer: object): Promise<{ response: Response; rateLimitHeaders: Record<string, string> }> {
  let retries503 = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let response: Response;
    try {
      response = await fetch(config.verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: config.hubToken,
          task: config.taskName,
          answer
        })
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Network error: ${message}`);
    }

    const rateLimitHeaders = parseRateLimitHeaders(response.headers);
    if (Object.keys(rateLimitHeaders).length > 0) {
      console.log(`[TOOL] Rate limit headers:`, rateLimitHeaders);
    }

    if (response.status === 429) {
      const waitMs = computeWaitMs(rateLimitHeaders);
      console.log(`[TOOL] Rate limit (429), waiting ${waitMs}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    if (response.status === 503) {
      retries503++;
      if (retries503 > config.max503Retries) throw new Error('Max 503 retries exceeded');
      const delayMs = config.initialRetryDelayMs * Math.pow(2, retries503 - 1);
      console.log(`[TOOL] Got 503, retry ${retries503}/${config.max503Retries}, waiting ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    return { response, rateLimitHeaders };
  }
}

async function callApi(answer: object): Promise<string> {
  console.log(`[TOOL] call_api: ${JSON.stringify(answer)}`);

  const { response, rateLimitHeaders } = await fetchWithRetry(answer);

  let body: any;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return JSON.stringify({
    status: response.status,
    body,
    headers: rateLimitHeaders
  });
}

export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const args = JSON.parse(toolCall.function.arguments);

  try {
    switch (toolCall.function.name) {
      case 'call_api':
        return await callApi(args.answer);

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[TOOL] Error in ${toolCall.function.name}: ${message}`);
    return JSON.stringify({ error: message });
  }
}
