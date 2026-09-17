export function createCollectionRateLimiter(msgsPerSecond: number) {
  let tokens = msgsPerSecond;
  let lastRefill = Date.now();

  const refill = () => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const tokensToAdd = (elapsed / 1000) * msgsPerSecond;
    if (tokensToAdd > 0) {
      tokens = Math.min(msgsPerSecond, tokens + tokensToAdd);
      lastRefill = now;
    }
  };

  return {
    async acquire(): Promise<void> {
      while (true) {
        refill();
        if (tokens >= 1) {
          tokens -= 1;
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
  };
}

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      // Do not retry on definite failures (e.g. invalid variables or disconnected auth)
      if (
        attempt > maxRetries ||
        (err.code &&
          ["invalid", "not_found", "not_connected", "reconnect_required"].includes(
            err.code
          ))
      ) {
        throw err;
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
