import { EMAIL_REGEX, PHONE_REGEX_ILS, URL_REGEX } from '@/components/constants/validation-regex';

/**
 * Check if value is required (not null, undefined, or empty string)
 * @param {any} value - Value to validate
 * @returns {boolean} - Whether value is present
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate phone number (Israeli format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX_ILS.test(phone.trim());
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return URL_REGEX.test(url.trim());
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @returns {boolean} - Whether value meets minimum length
 */
export const hasMinLength = (value, min) => {
  if (!value) return false;
  return String(value).length >= min;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} max - Maximum length
 * @returns {boolean} - Whether value is within maximum length
 */
export const hasMaxLength = (value, max) => {
  if (!value) return true; // Empty values are valid for max length
  return String(value).length <= max;
};

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @returns {boolean} - Whether value is a valid number
 */
export const isNumeric = (value) => {
  if (value === null || value === undefined) return false;
  return !isNaN(value) && isFinite(value);
};

/**
 * Validate integer value
 * @param {any} value - Value to validate
 * @returns {boolean} - Whether value is a valid integer
 */
export const isInteger = (value) => {
  return isNumeric(value) && Number.isInteger(Number(value));
};

/**
 * Validate positive number
 * @param {any} value - Value to validate
 * @returns {boolean} - Whether value is a positive number
 */
export const isPositive = (value) => {
  return isNumeric(value) && Number(value) > 0;
};

/**
 * Validate number within range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} - Whether value is within range
 */
export const isInRange = (value, min, max) => {
  if (!isNumeric(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether date string is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate that value matches pattern
 * @param {string} value - Value to validate
 * @param {RegExp} pattern - Regular expression pattern
 * @returns {boolean} - Whether value matches pattern
 */
export const matchesPattern = (value, pattern) => {
  if (!value || typeof value !== 'string') return false;
  return pattern.test(value);
};

/**
 * Validate array has minimum length
 * @param {array} arr - Array to validate
 * @param {number} min - Minimum length
 * @returns {boolean} - Whether array meets minimum length
 */
export const arrayMinLength = (arr, min) => {
  return Array.isArray(arr) && arr.length >= min;
};

/**
 * Validate array has maximum length
 * @param {array} arr - Array to validate
 * @param {number} max - Maximum length
 * @returns {boolean} - Whether array is within maximum length
 */
export const arrayMaxLength = (arr, max) => {
  if (!Array.isArray(arr)) return true;
  return arr.length <= max;
};