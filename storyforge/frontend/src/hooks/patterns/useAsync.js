/**
 * useAsync - Manage async operations with loading, error, and data states
 * 
 * @example
 * // Basic usage
 * const { execute, data, loading, error } = useAsync(async () => {
 *   const response = await fetch('/api/users');
 *   return response.json();
 * });
 * 
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 * 
 * @example
 * // With parameters
 * const { execute, data, loading, error } = useAsync(async (userId) => {
 *   const response = await fetch(`/api/users/${userId}`);
 *   return response.json();
 * });
 * 
 * const handleUserClick = (id) => {
 *   execute(id);
 * };
 * 
 * @example
 * // With immediate execution
 * const { data, loading, error, retry } = useAsync(
 *   async () => fetchUserData(),
 *   { immediate: true }
 * );
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for managing async operations
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Execute immediately on mount
 * @param {Function} options.onSuccess - Callback on successful execution
 * @param {Function} options.onError - Callback on error
 * @param {any} options.initialData - Initial data value
 * @returns {Object} Async state and control functions
 */
export function useAsync(asyncFunction, options = {}) {
  const {
    immediate = false,
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [state, setState] = useState({
    data: initialData,
    loading: immediate,
    error: null,
    isSuccess: false
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Execute the async function
  const execute = useCallback(async (...params) => {
    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Pass abort signal as last parameter
      const data = await asyncFunction(...params, { signal });
      
      if (isMountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
          isSuccess: true
        });
        
        if (onSuccess) {
          onSuccess(data);
        }
      }
      
      return data;
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }

      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error,
          isSuccess: false
        });
        
        if (onError) {
          onError(error);
        }
      }
      
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [asyncFunction, onSuccess, onError]);

  // Reset state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      data: initialData,
      loading: false,
      error: null,
      isSuccess: false
    });
  }, [initialData]);

  // Retry last execution
  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  // Cancel pending request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isSuccess: state.isSuccess,
    execute,
    reset,
    retry,
    cancel
  };
}

/**
 * Hook for lazy loading with async operations
 * @param {Function} importFunction - The dynamic import function
 * @returns {Object} Component and loading state
 */
export function useAsyncComponent(importFunction) {
  const [Component, setComponent] = useState(null);
  const { execute, loading, error } = useAsync(async () => {
    const module = await importFunction();
    return module.default || module;
  }, {
    onSuccess: (component) => setComponent(() => component)
  });

  useEffect(() => {
    execute();
  }, [execute]);

  return { Component, loading, error };
}

/**
 * Hook for async data fetching with caching
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} Cached data and control functions
 */
const cache = new Map();

export function useAsyncData(key, fetcher, options = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    refetchOnMount = true,
    ...asyncOptions
  } = options;

  const getCachedData = useCallback(() => {
    const cached = cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheTime;
    
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    const isStale = now - cached.timestamp > staleTime;
    return { ...cached, isStale };
  }, [key, cacheTime, staleTime]);

  const cachedData = getCachedData();
  const shouldRefetch = refetchOnMount || !cachedData || cachedData.isStale;

  const { data, loading, error, execute, ...rest } = useAsync(
    async (...params) => {
      const result = await fetcher(...params);
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    },
    {
      ...asyncOptions,
      immediate: shouldRefetch,
      initialData: cachedData?.data
    }
  );

  const invalidate = useCallback(() => {
    cache.delete(key);
    return execute();
  }, [key, execute]);

  return {
    data,
    loading: loading && !cachedData,
    error,
    execute,
    invalidate,
    isStale: cachedData?.isStale || false,
    ...rest
  };
}

// Default export
export default useAsync;