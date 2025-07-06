/**
 * useKeyboardShortcuts - Register and manage keyboard shortcuts
 * 
 * @example
 * // Single shortcut
 * useKeyboardShortcuts({
 *   'ctrl+s': (e) => {
 *     e.preventDefault();
 *     handleSave();
 *   }
 * });
 * 
 * @example
 * // Multiple shortcuts
 * useKeyboardShortcuts({
 *   'ctrl+s': handleSave,
 *   'ctrl+o': handleOpen,
 *   'escape': handleClose,
 *   'ctrl+shift+f': openSearch,
 *   '?': showHelp
 * });
 * 
 * @example
 * // With options
 * useKeyboardShortcuts({
 *   'cmd+k': openCommandPalette,
 *   'alt+1': () => switchTab(0),
 *   'alt+2': () => switchTab(1)
 * }, {
 *   enableOnFormElements: false,
 *   preventDefault: true,
 *   enabled: !isModalOpen
 * });
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Parse key combination string into structured format
 * @param {string} combo - Key combination (e.g., 'ctrl+shift+s')
 * @returns {Object} Parsed key combination
 */
function parseKeyCombo(combo) {
  const parts = combo.toLowerCase().split('+');
  const modifiers = {
    ctrl: false,
    cmd: false,
    alt: false,
    shift: false,
    meta: false
  };
  
  let key = parts[parts.length - 1];
  
  // Process modifiers
  for (let i = 0; i < parts.length - 1; i++) {
    const modifier = parts[i];
    if (modifier === 'ctrl' || modifier === 'control') {
      modifiers.ctrl = true;
    } else if (modifier === 'cmd' || modifier === 'command' || modifier === 'meta') {
      modifiers.meta = true;
      modifiers.cmd = true;
    } else if (modifier === 'alt' || modifier === 'option') {
      modifiers.alt = true;
    } else if (modifier === 'shift') {
      modifiers.shift = true;
    }
  }
  
  // Handle special keys
  const specialKeys = {
    'esc': 'escape',
    'del': 'delete',
    'ins': 'insert',
    'return': 'enter'
  };
  
  key = specialKeys[key] || key;
  
  return { key, modifiers };
}

/**
 * Check if keyboard event matches the parsed combination
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} combo - Parsed key combination
 * @returns {boolean} Whether the event matches
 */
function eventMatchesCombo(event, combo) {
  const { key, modifiers } = combo;
  
  // Check key
  const eventKey = event.key.toLowerCase();
  if (eventKey !== key && event.code.toLowerCase() !== `key${key}`) {
    return false;
  }
  
  // Check modifiers
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
  const metaKey = isMac ? event.metaKey : event.ctrlKey;
  
  return (
    (modifiers.ctrl ? ctrlKey : !event.ctrlKey) &&
    (modifiers.cmd || modifiers.meta ? metaKey : !event.metaKey) &&
    (modifiers.alt ? event.altKey : !event.altKey) &&
    (modifiers.shift ? event.shiftKey : !event.shiftKey)
  );
}

/**
 * Hook to register keyboard shortcuts
 * @param {Object} shortcuts - Map of shortcuts to handlers
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether shortcuts are enabled
 * @param {boolean} options.enableOnFormElements - Enable in input/textarea
 * @param {boolean} options.preventDefault - Prevent default for all shortcuts
 * @param {string} options.scope - Scope for shortcuts (for multiple instances)
 * @returns {Object} Shortcut management functions
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const {
    enabled = true,
    enableOnFormElements = false,
    preventDefault = true,
    scope = 'global'
  } = options;
  
  const shortcutsRef = useRef(shortcuts);
  const parsedShortcutsRef = useRef(new Map());
  
  // Update refs when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    
    // Parse all shortcuts
    const parsed = new Map();
    Object.entries(shortcuts).forEach(([combo, handler]) => {
      const parsedCombo = parseKeyCombo(combo);
      parsed.set(combo, { ...parsedCombo, handler });
    });
    parsedShortcutsRef.current = parsed;
  }, [shortcuts]);
  
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Check if we should ignore form elements
    if (!enableOnFormElements) {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const isFormElement = (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.contentEditable === 'true'
      );
      
      if (isFormElement) return;
    }
    
    // Check each shortcut
    for (const [combo, { handler, ...parsedCombo }] of parsedShortcutsRef.current) {
      if (eventMatchesCombo(event, parsedCombo)) {
        if (preventDefault) {
          event.preventDefault();
        }
        
        handler(event);
        break;
      }
    }
  }, [enabled, enableOnFormElements, preventDefault]);
  
  // Register event listener
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
  
  // Return helper functions
  return {
    registerShortcut: useCallback((combo, handler) => {
      const parsed = parseKeyCombo(combo);
      parsedShortcutsRef.current.set(combo, { ...parsed, handler });
      shortcutsRef.current[combo] = handler;
    }, []),
    
    unregisterShortcut: useCallback((combo) => {
      parsedShortcutsRef.current.delete(combo);
      delete shortcutsRef.current[combo];
    }, []),
    
    getShortcuts: useCallback(() => {
      return Object.keys(shortcutsRef.current);
    }, [])
  };
}

/**
 * Hook to display keyboard shortcuts help
 * @param {Object} shortcuts - Map of shortcuts to descriptions
 * @returns {Array} Formatted shortcuts for display
 */
export function useKeyboardShortcutsHelp(shortcuts) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return Object.entries(shortcuts).map(([combo, description]) => {
    // Format combo for display
    let displayCombo = combo;
    if (isMac) {
      displayCombo = displayCombo
        .replace(/ctrl/gi, '⌘')
        .replace(/cmd/gi, '⌘')
        .replace(/meta/gi, '⌘')
        .replace(/alt/gi, '⌥')
        .replace(/shift/gi, '⇧');
    } else {
      displayCombo = displayCombo
        .replace(/cmd/gi, 'Ctrl')
        .replace(/meta/gi, 'Ctrl');
    }
    
    // Capitalize first letter of each part
    displayCombo = displayCombo
      .split('+')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(isMac ? '' : '+');
    
    return {
      combo: displayCombo,
      description,
      raw: combo
    };
  });
}

// Default export
export default useKeyboardShortcuts;