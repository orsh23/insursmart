// Enhanced API utilities with better rate limiting and error handling
import { useState, useEffect, useCallback } from 'react';

// Delay utility for rate limiting
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry with exponential backoff and jitter
export const retryWithBackoff = async (
  operation, 
  context = 'API call', 
  maxRetries = 3, 
  baseDelay = 1000,
  maxDelay = 8000
) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        const totalDelay = exponentialDelay + jitter;
        
        console.log(`[${context}] Retry attempt ${attempt}/${maxRetries} after ${Math.round(totalDelay)}ms`);
        await delay(totalDelay);
      }
      
      const result = await operation();
      if (attempt > 0) {
        console.log(`[${context}] Retry successful on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[${context}] Attempt ${attempt + 1} failed:`, error);
      
      // Don't retry on certain error types
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        throw error;
      }
      
      // For rate limits, use longer delays
      if (error?.response?.status === 429) {
        if (attempt < maxRetries) {
          const rateLimitDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay * 2);
          console.log(`[${context}] Rate limited, waiting ${rateLimitDelay}ms before retry ${attempt + 1}`);
          await delay(rateLimitDelay);
        }
      }
    }
  }
  
  console.error(`[${context}] All retry attempts failed`);
  throw lastError;
};

// Safe entity operation wrapper
export const safeEntityCall = async (Entity, method, ...args) => {
  if (!Entity || typeof Entity[method] !== 'function') {
    throw new Error(`Entity method ${method} not available`);
  }
  
  try {
    const result = await Entity[method](...args);
    return result;
  } catch (error) {
    // Add more context to the error
    error.entityMethod = `${Entity.name || 'Unknown'}.${method}`;
    throw error;
  }
};

// Debounced fetch hook with caching
export const useDebouncedFetch = (
  fetchFunction, 
  dependencies = [], 
  debounceMs = 500,
  cacheKey = null
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple cache implementation
  const cache = useState(new Map())[0];

  const debouncedFetch = useCallback(
    debounce(async (...args) => {
      const key = cacheKey || JSON.stringify(args);
      
      // Check cache first
      if (cache.has(key)) {
        const cached = cache.get(key);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
          setData(cached.data);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchFunction(...args);
        setData(result);
        
        // Cache the result
        cache.set(key, { data: result, timestamp: Date.now() });
      } catch (err) {
        setError(err);
        console.error('Debounced fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [fetchFunction, debounceMs, cacheKey, cache]
  );

  useEffect(() => {
    debouncedFetch();
  }, dependencies);

  return { data, loading, error, refetch: debouncedFetch };
};

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhanced error handler that returns error details instead of directly showing toast
export const handleApiError = (error, defaultErrorKey = 'errors.genericApiError', defaultErrorMessage = 'An error occurred. Please try again.', context = 'API call') => {
  console.error(`[${context}] Error:`, error);
  
  const isRateLimitError = 
    error?.response?.status === 429 ||
    error?.status === 429 ||
    (error?.message && (
      error.message.includes('429') || 
      error.message.toLowerCase().includes('rate limit')
    ));
  
  const isNetworkError = 
    error?.message?.toLowerCase().includes('network error') ||
    error?.message?.toLowerCase().includes('failed to fetch') ||
    error?.code === 'NETWORK_ERROR';
  
  let errorKey = defaultErrorKey;
  let errorMessage = defaultErrorMessage;

  if (isRateLimitError) {
    errorKey = 'errors.rateLimitExceeded';
    errorMessage = 'Service is temporarily busy. Please try again in a few moments.';
  } else if (isNetworkError) {
    errorKey = 'errors.networkError';
    errorMessage = 'Network error. Please check your connection and try again.';
  }
  
  return { 
    isRateLimitError,
    isNetworkError,
    errorKey,
    errorMessage,
    originalError: error,
    context
  };
};

// Request queue for managing concurrent requests
class RequestQueue {
  constructor(maxConcurrent = 3, delayBetweenRequests = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
    this.queue = [];
    this.running = 0;
  }

  async add(requestFunction) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFunction, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { requestFunction, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFunction();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      
      // Add delay between requests to avoid rate limiting
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), this.delayBetweenRequests);
      } else {
        this.process();
      }
    }
  }
}

// Global request queue instance
export const globalRequestQueue = new RequestQueue(2, 200); // Max 2 concurrent, 200ms between requests

// Queued entity call
export const queuedEntityCall = async (Entity, method, ...args) => {
  return globalRequestQueue.add(() => safeEntityCall(Entity, method, ...args));
};