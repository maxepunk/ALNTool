/**
 * useLocalStorage - Sync state with localStorage
 * 
 * @example
 * // Simple usage
 * const [theme, setTheme] = useLocalStorage('app-theme', 'light');
 * 
 * @example
 * // With object state
 * const [userPrefs, setUserPrefs] = useLocalStorage('user-preferences', {
 *   language: 'en',
 *   notifications: true,
 *   autoSave: false
 * });
 * 
 * @example
 * // With custom serializer
 * const [data, setData] = useLocalStorage('complex-data', [], {
 *   serialize: (value) => customSerialize(value),
 *   deserialize: (value) => customDeserialize(value)
 * });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to sync state with localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value
 * @param {Object} options - Configuration options
 * @param {Function} options.serialize - Custom serializer (defaults to JSON.stringify)
 * @param {Function} options.deserialize - Custom deserializer (defaults to JSON.parse)
 * @param {boolean} options.syncAcrossTabs - Whether to sync across browser tabs
 * @returns {[any, Function, Function]} [value, setValue, remove]
 */
export function useLocalStorage(
  key,
  initialValue,
  options = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true
  } = options;

  // Use ref to track if it's the initial mount
  const isInitialMount = useRef(true);

  // Get initial value from localStorage or use provided initial value
  const readValue = useCallback(() => {
    // Prevent build-time errors
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value) => {
    // Prevent build-time errors
    if (typeof window === 'undefined') {
      console.warn(`Tried to set localStorage key "${key}" during SSR`);
      return;
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to local state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
      
      // Dispatch custom event to sync across tabs
      if (syncAcrossTabs) {
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, syncAcrossTabs]);

  // Remove value from localStorage
  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      // Dispatch custom event to sync across tabs
      if (syncAcrossTabs) {
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, value: undefined }
        }));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Listen for changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !syncAcrossTabs) {
      return;
    }

    // Handle storage event (cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    // Handle custom event (same-tab synchronization)
    const handleCustomEvent = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Only add listeners after initial mount to prevent infinite loops
    if (!isInitialMount.current) {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('local-storage', handleCustomEvent);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomEvent);
    };
  }, [key, deserialize, syncAcrossTabs]);

  // Update isInitialMount after first render
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Sync with localStorage on mount (handles cases where value changed in another tab)
  useEffect(() => {
    const currentValue = readValue();
    if (currentValue !== storedValue) {
      setStoredValue(currentValue);
    }
  }, []);

  return [storedValue, setValue, remove];
}

/**
 * Hook to check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
export function useLocalStorageAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    try {
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  return available;
}

// Default export
export default useLocalStorage;