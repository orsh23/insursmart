
/**
 * Format currency with locale support
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'ILS')
 * @param {string} locale - Locale code (default: 'he-IL')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'ILS', locale = 'he-IL') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales or other Intl.NumberFormat issues
    return `${amount.toFixed(2)} ${currency}`;
  }
};

/**
 * Format number with locale support
 * @param {number} num - Number to format
 * @param {string} locale - Locale code (default: 'he-IL')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num, locale = 'he-IL', options = {}) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (error) {
    // Fallback for unsupported locales or other Intl.NumberFormat issues
    return num.toString();
  }
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether input is decimal (0-1) or percentage (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} locale - Locale code
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, isDecimal = true, decimals = 1, locale = 'he-IL') => {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  const percentage = isDecimal ? value : value / 100;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(percentage);
  } catch (error) {
    // Fallback for unsupported locales or other Intl.NumberFormat issues
    return `${(percentage * 100).toFixed(decimals)}%`;
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return ''; // Handles null, undefined, NaN
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Use parseFloat to remove unnecessary trailing zeros (e.g., 1.00 MB -> 1 MB)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Check if value is a valid number (non-null, non-undefined, not NaN, and finite)
 * @param {any} value - Value to check
 * @returns {boolean} - Whether value is a valid number
 */
export const isValidNumber = (value) => {
  return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
};

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} - Rounded number
 */
export const roundNumber = (num, decimals = 2) => {
  if (!isValidNumber(num)) return 0;
  
  // Calculate the factor once to improve readability and avoid repeated calculation
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Clamp number between min and max values
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped number
 */
export const clampNumber = (num, min, max) => {
  if (!isValidNumber(num)) return min; // Default to min if input is not a valid number
  return Math.min(Math.max(num, min), max);
};
