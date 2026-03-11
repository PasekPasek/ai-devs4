export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[RETRY] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
