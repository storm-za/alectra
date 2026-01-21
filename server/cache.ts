// Simple in-memory cache for API responses
// Dramatically improves response times for frequently accessed data

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 500; // Maximum cache entries

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Delete all entries matching a prefix
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton cache instance
export const apiCache = new MemoryCache();

// Cache TTLs in seconds
export const CACHE_TTL = {
  PRODUCTS: 300,      // 5 minutes - products change rarely
  CATEGORIES: 600,    // 10 minutes - categories almost never change
  PRODUCT_DETAIL: 300, // 5 minutes
  PRODUCT_RATING: 300, // 5 minutes
  PRODUCT_REVIEWS: 300, // 5 minutes
  BRANDS: 600,        // 10 minutes
  FREQUENTLY_BOUGHT: 600, // 10 minutes
};
