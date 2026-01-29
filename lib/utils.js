import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";

/**
 * Merge Tailwind classes intelligently
 * @param {...string} inputs - Class names to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Toast notification helpers for quick feedback
 * Usage: showToast.success("Saved!") or showToast.error("Failed")
 */
export const showToast = {
  success: (message) => toast.success(message, { position: "bottom-right", autoClose: 3000 }),
  error: (message) => toast.error(message, { position: "bottom-right", autoClose: 4000 }),
  info: (message) => toast.info(message, { position: "bottom-right", autoClose: 3000 }),
  loading: (message) => toast.loading(message, { position: "bottom-right" }),
};

/**
 * [js-cache-function-results] Module-level cache for expensive function results
 * Use for functions called repeatedly with the same inputs
 * @template T
 * @param {function(...any): T} fn - Function to memoize
 * @returns {function(...any): T} Memoized function
 */
export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * [js-cache-storage] Cached localStorage access
 * Reduces expensive I/O by caching reads in memory
 */
const storageCache = new Map();

export const cachedStorage = {
  get: (key) => {
    if (typeof window === "undefined") return null;
    if (!storageCache.has(key)) {
      try {
        storageCache.set(key, localStorage.getItem(key));
      } catch {
        return null;
      }
    }
    return storageCache.get(key);
  },
  set: (key, value) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
      storageCache.set(key, value);
    } catch {
      // Quota exceeded or disabled
    }
  },
  remove: (key) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
      storageCache.delete(key);
    } catch {
      // Disabled
    }
  },
  // Clear cache on visibility change (another tab might have modified storage)
  invalidate: () => storageCache.clear(),
};

/**
 * [js-index-maps] Build a Map for O(1) lookups from an array
 * Use when you need repeated .find() calls by the same key
 * @template T
 * @param {T[]} array - Array to index
 * @param {keyof T | ((item: T) => string)} keyFn - Key field or function
 * @returns {Map<string, T>} Indexed map
 */
export function indexBy(array, keyFn) {
  const getKey = typeof keyFn === "function" ? keyFn : (item) => item[keyFn];
  return new Map(array.map((item) => [getKey(item), item]));
}

/**
 * [async-parallel] Execute independent async operations in parallel
 * @template T
 * @param {Record<string, () => Promise<T>>} tasks - Named async functions
 * @returns {Promise<Record<string, T>>} Results keyed by task name
 */
export async function parallel(tasks) {
  const entries = Object.entries(tasks);
  const results = await Promise.all(entries.map(([, fn]) => fn()));
  return Object.fromEntries(entries.map(([key], i) => [key, results[i]]));
}
