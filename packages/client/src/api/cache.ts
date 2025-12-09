/**
 * Simple request cache and deduplication layer
 * Reduces redundant API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly DEFAULT_TTL = 5000; // 5 seconds default cache

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Deduplicate concurrent requests
   * If same request is in-flight, return the pending promise instead of making new request
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already in-flight
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // Dedup: Return existing promise instead of making new request
      return pending.promise;
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        this.set(key, data, ttl);
        return data;
      })
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(key);
      });

    // Track pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const apiCache = new ApiCache();

// Cache key builders for consistency
export const cacheKeys = {
  addresses: () => 'addresses',
  environments: () => 'environments',
  gasCoins: (address: string) => `gas:${address}`,
  objects: (address: string) => `objects:${address}`,
  communityStatus: (address?: string) => address ? `community:${address}` : 'community',
  tierInfo: (address: string) => `tier:${address}`,
  status: () => 'status',
} as const;
