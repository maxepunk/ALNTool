/**
 * useDebounce - Debounce a value or callback function
 * 
 * @example
 * // Debounce a value
 * const SearchInput = () => {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *   
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // Perform search with debounced value
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *   
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *     />
 *   );
 * };
 * 
 * @example
 * // Debounce a callback
 * const AutoSaveForm = () => {
 *   const debouncedSave = useDebounce((data) => {
 *     saveToServer(data);
 *   }, 1000);
 *   
 *   const handleChange = (fieldData) => {
 *     updateLocalState(fieldData);
 *     debouncedSave(fieldData);
 *   };
 * };
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {Array} dependencies - Optional dependencies array
 * @returns {Function} The debounced callback
 */
export function useDebouncedCallback(callback, delay = 500, dependencies = []) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Advanced debounce hook with cancel and flush capabilities
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Object} Object with debounced callback, cancel, and flush methods
 */
export function useAdvancedDebounce(callback, delay = 500) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current);
      callbackRef.current(...lastArgsRef.current);
      timeoutRef.current = null;
      lastArgsRef.current = null;
    }
  }, []);

  const debouncedCallback = useCallback((...args) => {
    lastArgsRef.current = args;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
      lastArgsRef.current = null;
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    callback: debouncedCallback,
    cancel,
    flush
  };
}

// Default export is the simple value debounce
export default useDebounce;