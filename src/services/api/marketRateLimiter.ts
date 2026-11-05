/**
 * Lightweight client-side rate limiter for outbound crypto API calls.
 * - Serializes requests with a min interval
 * - Coalesces duplicate in-flight requests by key
 * - Honors Retry-After / 429 cooldowns
 */

type QueueItem = {
  key: string;
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class MarketRateLimiter {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastRequestAt = 0;
  private cooldownUntil = 0;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly minIntervalMs: number = 1500) {}

  /**
   * Schedule work. Identical in-flight keys share one promise (stampede guard).
   */
  schedule<T>(key: string, run: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        run: run as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      void this.processQueue();
    });

    this.inFlight.set(key, promise);
    promise.finally(() => {
      // Only clear if this is still the active in-flight entry
      if (this.inFlight.get(key) === promise) {
        this.inFlight.delete(key);
      }
    });

    return promise;
  }

  /** Apply a cooldown from a 429 / Retry-After response. */
  notifyRateLimited(retryAfterMs?: number): void {
    const wait = Math.max(
      retryAfterMs ?? this.minIntervalMs * 4,
      this.minIntervalMs
    );
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + wait);
  }

  /** Parse Retry-After header (seconds or HTTP-date) into milliseconds. */
  static parseRetryAfter(header: string | number | undefined | null): number | undefined {
    if (header == null || header === '') return undefined;
    if (typeof header === 'number' && Number.isFinite(header)) {
      return Math.max(0, header * 1000);
    }
    const asNumber = Number(header);
    if (!Number.isNaN(asNumber)) {
      return Math.max(0, asNumber * 1000);
    }
    const asDate = Date.parse(String(header));
    if (!Number.isNaN(asDate)) {
      return Math.max(0, asDate - Date.now());
    }
    return undefined;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const waitForInterval = Math.max(0, this.minIntervalMs - (now - this.lastRequestAt));
      const waitForCooldown = Math.max(0, this.cooldownUntil - now);
      const delay = Math.max(waitForInterval, waitForCooldown);

      if (delay > 0) {
        await sleep(delay);
      }

      const item = this.queue.shift();
      if (!item) break;

      this.lastRequestAt = Date.now();
      try {
        const result = await item.run();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Shared limiter for all market/price outbound calls in the app. */
export const marketRateLimiter = new MarketRateLimiter(1500);
