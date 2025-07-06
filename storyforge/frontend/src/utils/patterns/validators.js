/**
 * Validators - Reusable validation functions for forms and data
 * 
 * @module utils/patterns/validators
 */

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {boolean} Valid email format
 * 
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid.email') // false
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} Valid URL format
 * 
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Phone number validation (US format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Valid phone format
 * 
 * @example
 * isValidPhone('123-456-7890') // true
 * isValidPhone('(123) 456-7890') // true
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Password strength validation
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength score
 * 
 * @example
 * validatePassword('weak') 
 * // { valid: false, score: 1, feedback: ['At least 8 characters required'] }
 */
export const validatePassword = (password) => {
  const feedback = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters required');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Include special characters');

  return {
    valid: score >= 3,
    score,
    strength: ['very weak', 'weak', 'fair', 'good', 'strong'][score],
    feedback
  };
};

/**
 * Required field validation
 * @param {*} value - Value to check
 * @returns {boolean} Has value
 * 
 * @example
 * isRequired('text') // true
 * isRequired('') // false
 * isRequired([]) // false
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Minimum length validation
 * @param {string|Array} value - Value to check
 * @param {number} min - Minimum length
 * @returns {boolean} Meets minimum length
 * 
 * @example
 * minLength('hello', 3) // true
 * minLength([1, 2], 3) // false
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

/**
 * Maximum length validation
 * @param {string|Array} value - Value to check
 * @param {number} max - Maximum length
 * @returns {boolean} Within maximum length
 * 
 * @example
 * maxLength('hello', 10) // true
 * maxLength('too long text', 5) // false
 */
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};

/**
 * Number range validation
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Within range
 * 
 * @example
 * inRange(5, 1, 10) // true
 * inRange(15, 1, 10) // false
 */
export const inRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

/**
 * Pattern matching validation
 * @param {string} value - Value to match
 * @param {RegExp|string} pattern - Pattern to match against
 * @returns {boolean} Matches pattern
 * 
 * @example
 * matches('ABC123', /^[A-Z]+[0-9]+$/) // true
 * matches('hello', '^[a-z]+$') // true
 */
export const matches = (value, pattern) => {
  if (!value) return false;
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return regex.test(value);
};

/**
 * Date validation
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean} Valid date
 * 
 * @example
 * isValidDate('2023-12-25') // true
 * isValidDate('invalid-date') // false
 * isValidDate('2023-12-25', { after: '2023-01-01' }) // true
 */
export const isValidDate = (date, options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return false;

  if (options.after) {
    const afterDate = new Date(options.after);
    if (dateObj <= afterDate) return false;
  }

  if (options.before) {
    const beforeDate = new Date(options.before);
    if (dateObj >= beforeDate) return false;
  }

  return true;
};

/**
 * ALNTool-specific validators
 */

/**
 * Entity ID validation
 * @param {string} id - Entity ID to validate
 * @returns {boolean} Valid entity ID format
 * 
 * @example
 * isValidEntityId('char_123abc') // true
 * isValidEntityId('invalid') // false
 */
export const isValidEntityId = (id) => {
  if (!id || typeof id !== 'string') return false;
  // Entity IDs should start with type prefix
  return /^(char|elem|puzz|time)_[a-zA-Z0-9]+$/.test(id);
};

/**
 * Memory value validation
 * @param {number} value - Memory value to validate
 * @returns {boolean} Valid memory value
 * 
 * @example
 * isValidMemoryValue(5) // true
 * isValidMemoryValue(15) // false
 */
export const isValidMemoryValue = (value) => {
  return inRange(value, 0, 10);
};

/**
 * Act number validation
 * @param {number} act - Act number to validate
 * @returns {boolean} Valid act number
 * 
 * @example
 * isValidAct(1) // true
 * isValidAct(3) // false
 */
export const isValidAct = (act) => {
  return inRange(act, 1, 2);
};

/**
 * Composite validation runner
 * @param {*} value - Value to validate
 * @param {Array} rules - Array of validation rules
 * @returns {Object} Validation result
 * 
 * @example
 * validate('test@example.com', [
 *   { rule: isRequired, message: 'Email is required' },
 *   { rule: isValidEmail, message: 'Invalid email format' }
 * ])
 * // { valid: true, errors: [] }
 */
export const validate = (value, rules) => {
  const errors = [];

  for (const { rule, message, params } of rules) {
    const isValid = params ? rule(value, ...params) : rule(value);
    if (!isValid) {
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Form validation helper
 * @param {Object} values - Form values
 * @param {Object} rules - Validation rules by field
 * @returns {Object} Validation results by field
 * 
 * @example
 * validateForm(
 *   { email: 'test@example.com', password: 'weak' },
 *   {
 *     email: [
 *       { rule: isRequired, message: 'Email required' },
 *       { rule: isValidEmail, message: 'Invalid email' }
 *     ],
 *     password: [
 *       { rule: isRequired, message: 'Password required' },
 *       { rule: (v) => minLength(v, 8), message: 'Min 8 characters' }
 *     ]
 *   }
 * )
 */
export const validateForm = (values, rules) => {
  const results = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validate(values[field], fieldRules);
    results[field] = result;
    if (!result.valid) isValid = false;
  }

  return {
    isValid,
    fields: results
  };
};