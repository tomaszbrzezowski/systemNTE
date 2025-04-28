import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure to click "Connect to Supabase" button.'
  );
}

// Ensure URL has protocol
const normalizedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;

// Validate Supabase URL format
try {
  const url = new URL(normalizedUrl);
  if (!url.protocol.startsWith('https')) {
    console.warn('Warning: Using non-HTTPS protocol for Supabase URL');
  }
} catch (e) {
  throw new Error('Invalid Supabase URL format. Please check your environment variables.');
}

// Cache configuration
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const queryCache = new Map<string, { data: any; timestamp: number }>();
const mutationCache = new Map<string, Promise<any>>();

// Browser-safe debounce helper
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeout: NodeJS.Timeout;
  let pendingPromise: Promise<any> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (pendingPromise) return pendingPromise;

    const promise = new Promise<ReturnType<T>>((resolve, reject) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
          pendingPromise = null;
        } catch (error) {
          reject(error);
          pendingPromise = null;
        }
      }, wait);
    });
    
    pendingPromise = promise;
    return promise;
  };
};

// Enhanced network connectivity check with timeout and retry
const checkConnectivity = async (url: string, retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      if (i === retries - 1) {
        console.warn('Connectivity check failed after retries:', error);
        return false;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 8000)));
    }
  }
  return false;
};

const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true, 
    detectSessionInUrl: false,
    storageKey: 'sb-auth-token',
    storage: {
      getItem: (key: string): Promise<string | null> => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.error('Error writing to localStorage:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string): Promise<void> => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.error('Error removing from localStorage:', error);
          return Promise.resolve();
        }
      }
    }
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

export const supabase = createClient<Database>(normalizedUrl, supabaseAnonKey, supabaseConfig);

// Add event listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear all local storage data
    try {
      for (const key in localStorage) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Redirect to login page
    window.location.href = '/';
  }
});

// Enhanced caching wrapper with optimistic updates and better error handling
export const cachedQuery = async (key: string, queryFn: () => Promise<any>) => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Check if there's a pending mutation for this key
  const pendingMutation = mutationCache.get(key);
  if (pendingMutation) {
    return pendingMutation;
  }

  // Check connectivity before making the request
  const isConnected = await checkConnectivity(normalizedUrl);
  if (!isConnected) {
    throw new Error('Network connectivity issue. Please check your internet connection and try again.');
  }

  try {
    const data = await queryFn();
    queryCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error executing cached query:', error.message);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
    throw error;
  }
};

// Add mutation wrapper with optimistic updates and enhanced error handling
export const mutateQuery = async (key: string, mutationFn: () => Promise<any>) => {
  // Check connectivity before making the request
  const isConnected = await checkConnectivity(normalizedUrl);
  if (!isConnected) {
    throw new Error('Network connectivity issue. Please check your internet connection and try again.');
  }

  // Create mutation promise
  const mutationPromise = mutationFn();
  mutationCache.set(key, mutationPromise);

  try {
    const result = await mutationPromise;
    // Clear cache on successful mutation
    queryCache.delete(key);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error executing mutation:', error.message);
      throw new Error(`Failed to update data: ${error.message}`);
    }
    throw error;
  } finally {
    mutationCache.delete(key);
  }
};

// Debounced mutation helper
export const debouncedMutation = (key: string, fn: () => Promise<any>, wait = 300) => {
  return debounce(async () => mutateQuery(key, fn), wait)();
};